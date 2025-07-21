import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/payment/stripe.service';
import { EwayService } from '../services/payment/eway.service';
import { CurrencyService } from '../services/currency/currency.service';
import { getErrorMessage } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Controller for payment method management
 */
export class PaymentMethodController {
  private prisma: PrismaClient;
  private stripeService: StripeService;
  private ewayService: EwayService;
  private currencyService: CurrencyService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stripeService = new StripeService();
    this.ewayService = new EwayService();
    this.currencyService = new CurrencyService();
  }

  /**
   * Create Stripe setup intent for payment method
   */
  async createSetupIntent(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId, currency = 'AUD' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      // Get or create Stripe customer
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          users: {
            include: { user: true }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found'
        });
        return;
      }

      const ownerUser = workspace.users.find(wu => wu.role === 'owner')?.user;
      if (!ownerUser) {
        res.status(400).json({
          success: false,
          error: 'Workspace owner not found'
        });
        return;
      }

      const setupIntent = await this.stripeService.createSetupIntent({
        customerId: ownerUser.id,
        currency,
        metadata: { workspaceId, userId }
      });

      res.status(200).json({
        success: true,
        data: { setupIntent }
      });
      return;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Get payment methods for workspace
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      // Get Stripe payment methods
      const stripePaymentMethods = await this.stripeService.getPaymentMethods(workspaceId);
      
      // Get eWAY payment methods
      const ewayPaymentMethods = await this.ewayService.getPaymentMethods(workspaceId);

      const paymentMethods = [
        ...stripePaymentMethods.map(pm => ({ ...pm, gateway: 'stripe' })),
        ...ewayPaymentMethods.map(pm => ({ ...pm, gateway: 'eway' }))
      ];

      res.status(200).json({
        success: true,
        data: { paymentMethods }
      });
      return;
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Convert currency amount
   */
  async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { amount, fromCurrency, toCurrency } = req.body;

      if (!amount || !fromCurrency || !toCurrency) {
        res.status(400).json({
          success: false,
          error: 'Missing required parameters: amount, fromCurrency, toCurrency'
        });
        return;
      }

      const convertedAmount = await this.currencyService.convertCurrency(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      );

      const exchangeRate = await this.currencyService.getExchangeRate(
        fromCurrency,
        toCurrency
      );

      res.status(200).json({
        success: true,
        data: {
          originalAmount: parseFloat(amount),
          convertedAmount,
          fromCurrency,
          toCurrency,
          exchangeRate
        }
      });
      return;
    } catch (error) {
      logger.error('Failed to convert currency:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }
}