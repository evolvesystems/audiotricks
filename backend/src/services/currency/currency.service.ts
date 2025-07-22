import { PrismaClient } from '@prisma/client';

/**
 * Stub Currency Service for compilation
 * Original implementation moved to temp-excluded directory
 */
export class CurrencyService {
  constructor(private prisma: PrismaClient) {}

  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    // Simple stub - just return the same amount for now
    return amount;
  }

  async getExchangeRate(currencyCode: string): Promise<number> {
    // Return 1.0 as default rate
    return 1.0;
  }
}