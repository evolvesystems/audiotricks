import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  lastUpdated: Date;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: Date;
}

/**
 * Currency service for handling multi-currency support
 * Includes exchange rate management and price conversion
 */
export class CurrencyService {
  private prisma: PrismaClient;
  private baseCurrency = 'USD';

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Initialize supported currencies
   */
  async initializeCurrencies(): Promise<void> {
    try {
      const currencies = [
        { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, exchangeRate: 1.0 },
        { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, exchangeRate: 0.85 },
        { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, exchangeRate: 0.73 },
        { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, exchangeRate: 1.35 },
        { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, exchangeRate: 1.25 },
        { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, exchangeRate: 110.0 },
        { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, exchangeRate: 0.92 },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, exchangeRate: 8.5 },
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, exchangeRate: 8.8 },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, exchangeRate: 6.3 },
        { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, exchangeRate: 1.35 },
        { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, exchangeRate: 7.8 },
        { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, exchangeRate: 1.45 },
        { code: 'MXN', name: 'Mexican Peso', symbol: '$', decimalPlaces: 2, exchangeRate: 20.0 },
        { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2, exchangeRate: 5.2 },
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, exchangeRate: 75.0 },
        { code: 'KRW', name: 'South Korean Won', symbol: '₩', decimalPlaces: 0, exchangeRate: 1200.0 },
        { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, exchangeRate: 6.5 },
        { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, exchangeRate: 15.0 },
        { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', decimalPlaces: 2, exchangeRate: 4.0 }
      ];

      for (const currency of currencies) {
        await this.prisma.currency.upsert({
          where: { code: currency.code },
          update: {
            exchangeRate: currency.exchangeRate,
            lastUpdated: new Date()
          },
          create: {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            decimalPlaces: currency.decimalPlaces,
            exchangeRate: currency.exchangeRate,
            lastUpdated: new Date(),
            isActive: true
          }
        });
      }

      logger.info('Initialized currency data');
    } catch (error) {
      logger.error('Failed to initialize currencies:', error);
      throw new Error(`Failed to initialize currencies: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get all active currencies
   */
  async getActiveCurrencies(): Promise<CurrencyRate[]> {
    try {
      const currencies = await this.prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });

      return currencies.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        rate: Number(currency.exchangeRate || 1),
        lastUpdated: currency.lastUpdated || new Date()
      }));
    } catch (error) {
      logger.error('Failed to get active currencies:', error);
      throw new Error(`Failed to get currencies: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get currency by code
   */
  async getCurrency(code: string): Promise<CurrencyRate | null> {
    try {
      const currency = await this.prisma.currency.findUnique({
        where: { code: code.toUpperCase() }
      });

      if (!currency) {
        return null;
      }

      return {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        rate: Number(currency.exchangeRate || 1),
        lastUpdated: currency.lastUpdated || new Date()
      };
    } catch (error) {
      logger.error('Failed to get currency:', error);
      throw new Error(`Failed to get currency: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConversionResult> {
    try {
      if (fromCurrency === toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          amount,
          convertedAmount: amount,
          rate: 1,
          timestamp: new Date()
        };
      }

      const fromRate = await this.getExchangeRate(fromCurrency);
      const toRate = await this.getExchangeRate(toCurrency);

      // Convert to USD first, then to target currency
      const usdAmount = amount / fromRate;
      const convertedAmount = usdAmount * toRate;
      const directRate = toRate / fromRate;

      return {
        fromCurrency,
        toCurrency,
        amount,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        rate: Math.round(directRate * 10000) / 10000,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Failed to convert currency:', error);
      throw new Error(`Failed to convert currency: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get exchange rate for a currency (relative to USD)
   */
  async getExchangeRate(currencyCode: string): Promise<number> {
    try {
      if (currencyCode === this.baseCurrency) {
        return 1.0;
      }

      const currency = await this.prisma.currency.findUnique({
        where: { code: currencyCode.toUpperCase() }
      });

      if (!currency || !currency.exchangeRate) {
        throw new Error(`Exchange rate not found for currency: ${currencyCode}`);
      }

      return Number(currency.exchangeRate);
    } catch (error) {
      logger.error(`Failed to get exchange rate for ${currencyCode}:`, error);
      throw new Error(`Failed to get exchange rate: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update exchange rates (this would typically call an external API)
   */
  async updateExchangeRates(): Promise<void> {
    try {
      // In a real implementation, this would fetch rates from an API like:
      // - OpenExchangeRates
      // - CurrencyLayer
      // - Fixer.io
      // - European Central Bank

      // For now, we'll use mock data
      const mockRates = {
        EUR: 0.85,
        GBP: 0.73,
        AUD: 1.35,
        CAD: 1.25,
        JPY: 110.0,
        CHF: 0.92,
        SEK: 8.5,
        NOK: 8.8,
        DKK: 6.3,
        SGD: 1.35,
        HKD: 7.8,
        NZD: 1.45,
        MXN: 20.0,
        BRL: 5.2,
        INR: 75.0,
        KRW: 1200.0,
        CNY: 6.5,
        ZAR: 15.0,
        PLN: 4.0
      };

      const updatePromises = Object.entries(mockRates).map(([code, rate]) =>
        this.prisma.currency.updateMany({
          where: { code },
          data: {
            exchangeRate: rate,
            lastUpdated: new Date()
          }
        })
      );

      await Promise.all(updatePromises);
      logger.info('Updated exchange rates');
    } catch (error) {
      logger.error('Failed to update exchange rates:', error);
      throw new Error(`Failed to update exchange rates: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Format amount with currency symbol
   */
  formatCurrency(amount: number, currencyCode: string, locale: string = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        minimumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2,
        maximumFractionDigits: currencyCode === 'JPY' || currencyCode === 'KRW' ? 0 : 2
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting
      return `${amount} ${currencyCode}`;
    }
  }

  /**
   * Get preferred currency for a region/country
   */
  getPreferredCurrency(countryCode: string): string {
    const currencyMap: Record<string, string> = {
      US: 'USD',
      CA: 'CAD',
      GB: 'GBP',
      AU: 'AUD',
      NZ: 'NZD',
      JP: 'JPY',
      CH: 'CHF',
      SE: 'SEK',
      NO: 'NOK',
      DK: 'DKK',
      SG: 'SGD',
      HK: 'HKD',
      MX: 'MXN',
      BR: 'BRL',
      IN: 'INR',
      KR: 'KRW',
      CN: 'CNY',
      ZA: 'ZAR',
      PL: 'PLN',
      // European Union countries
      DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', PT: 'EUR',
      NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR',
      GR: 'EUR', LU: 'EUR', CY: 'EUR', MT: 'EUR', SI: 'EUR',
      SK: 'EUR', EE: 'EUR', LV: 'EUR', LT: 'EUR'
    };

    return currencyMap[countryCode.toUpperCase()] || 'USD';
  }

  /**
   * Check if currency is supported
   */
  async isCurrencySupported(currencyCode: string): Promise<boolean> {
    try {
      const currency = await this.prisma.currency.findUnique({
        where: { 
          code: currencyCode.toUpperCase(),
        }
      });

      return currency?.isActive || false;
    } catch (error) {
      logger.error('Failed to check currency support:', error);
      return false;
    }
  }

  /**
   * Get currencies supported by payment gateways
   */
  async getGatewaySupportedCurrencies(gateway: string): Promise<string[]> {
    try {
      const config = await this.prisma.paymentGatewayConfig.findUnique({
        where: { gateway }
      });

      return config?.supportedCurrencies || [];
    } catch (error) {
      logger.error('Failed to get gateway supported currencies:', error);
      return [];
    }
  }

  /**
   * Convert plan pricing to different currency
   */
  async convertPlanPricing(planId: string, targetCurrency: string): Promise<any[]> {
    try {
      const planPricing = await this.prisma.planPricing.findMany({
        where: { planId, isActive: true }
      });

      const convertedPricing = [];

      for (const pricing of planPricing) {
        if (pricing.currency === targetCurrency) {
          // Already in target currency
          convertedPricing.push({
            currency: pricing.currency,
            price: Number(pricing.price),
            billingPeriod: pricing.billingPeriod,
            original: true
          });
        } else {
          // Convert from original currency to target
          const conversion = await this.convertCurrency(
            Number(pricing.price),
            pricing.currency,
            targetCurrency
          );

          convertedPricing.push({
            currency: targetCurrency,
            price: conversion.convertedAmount,
            billingPeriod: pricing.billingPeriod,
            original: false,
            convertedFrom: pricing.currency,
            exchangeRate: conversion.rate
          });
        }
      }

      return convertedPricing;
    } catch (error) {
      logger.error('Failed to convert plan pricing:', error);
      throw new Error(`Failed to convert pricing: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get currency symbol
   */
  async getCurrencySymbol(currencyCode: string): Promise<string> {
    try {
      const currency = await this.getCurrency(currencyCode);
      return currency?.symbol || currencyCode;
    } catch (error) {
      return currencyCode;
    }
  }

  /**
   * Schedule exchange rate updates
   */
  async scheduleRateUpdates(): Promise<void> {
    // Update rates every 6 hours
    setInterval(async () => {
      try {
        await this.updateExchangeRates();
        logger.info('Scheduled exchange rate update completed');
      } catch (error) {
        logger.error('Scheduled exchange rate update failed:', error);
      }
    }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds

    logger.info('Scheduled currency rate updates every 6 hours');
  }
}