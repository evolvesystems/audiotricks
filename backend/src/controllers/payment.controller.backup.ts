import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/payment/stripe.service';
import { EwayService } from '../services/payment/eway.service';
import { SubscriptionService } from '../services/subscription/subscription.service';
import { CurrencyService } from '../services/currency/currency.service';
import { getErrorMessage } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Payment controller for handling subscription payments, billing, and webhooks
 */
export class PaymentController {
  private prisma: PrismaClient;
  private stripeService: StripeService;
  private ewayService: EwayService;
  private subscriptionService: SubscriptionService;
  private currencyService: CurrencyService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stripeService = new StripeService(prisma);
    this.ewayService = new EwayService(prisma);
    this.subscriptionService = new SubscriptionService(prisma);
    this.currencyService = new CurrencyService(prisma);
  }

  /**
   * Get available subscription plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const { currency = 'USD', region } = req.query;
      
      const plans = await this.subscriptionService.getAvailablePlans(
        currency as string,
        region as string
      );

      res.status(200).json({
        success: true,
        data: { plans }
      });
    } catch (error) {
      logger.error('Failed to get plans:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Get supported currencies
   */
  async getCurrencies(req: Request, res: Response): Promise<void> {
    try {
      const currencies = await this.currencyService.getActiveCurrencies();

      res.status(200).json({
        success: true,
        data: { currencies }
      });
    } catch (error) {
      logger.error('Failed to get currencies:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Create payment setup intent for saving payment method
   */
  async createSetupIntent(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId,
              role: { in: ['owner', 'admin'] }
            }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      // Get or create Stripe customer
      let subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId }
      });

      let customerId = subscription?.stripeCustomerId;
      if (!customerId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId }
        });

        customerId = await this.stripeService.createCustomer(
          workspaceId,
          user?.email || '',
          workspace.name
        );
      }

      const setupIntent = await this.stripeService.createSetupIntent(customerId);

      res.status(200).json({
        success: true,
        data: {
          clientSecret: setupIntent.client_secret,
          customerId
        }
      });
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { planId, paymentMethodId, currency = 'USD' } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!planId || !paymentMethodId) {
        res.status(400).json({
          success: false,
          error: 'Plan ID and payment method ID are required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId,
              role: { in: ['owner', 'admin'] }
            }
          }
        },
        include: {
          users: {
            where: { userId },
            include: { user: true }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const user = workspace.users[0]?.user;
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      const subscription = await this.subscriptionService.createSubscription({
        workspaceId,
        planId,
        paymentMethodId,
        currency,
        customerEmail: user.email,
        customerName: `${user.firstName} ${user.lastName}`.trim() || workspace.name
      });

      res.status(201).json({
        success: true,
        data: { subscription }
      });
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Get workspace subscription
   */
  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: { userId }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const subscription = await this.subscriptionService.getWorkspaceSubscription(workspaceId);

      res.status(200).json({
        success: true,
        data: { subscription }
      });
    } catch (error) {
      logger.error('Failed to get subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { planId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      if (!planId) {
        res.status(400).json({
          success: false,
          error: 'Plan ID is required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId,
              role: { in: ['owner', 'admin'] }
            }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const currentSubscription = await this.subscriptionService.getWorkspaceSubscription(workspaceId);
      if (!currentSubscription) {
        res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
        return;
      }

      const updatedSubscription = await this.subscriptionService.updateSubscriptionPlan(
        currentSubscription.id,
        planId
      );

      res.status(200).json({
        success: true,
        data: { subscription: updatedSubscription }
      });
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: {
              userId,
              role: { in: ['owner', 'admin'] }
            }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const subscription = await this.subscriptionService.getWorkspaceSubscription(workspaceId);
      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'No active subscription found'
        });
        return;
      }

      await this.subscriptionService.cancelSubscription(subscription.id, reason);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Get billing history
   */
  async getBillingHistory(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const { limit = 10 } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: { userId }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const billingHistory = await this.subscriptionService.getBillingHistory(
        workspaceId,
        parseInt(limit as string)
      );

      res.status(200).json({
        success: true,
        data: { billingHistory }
      });
    } catch (error) {
      logger.error('Failed to get billing history:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Get current usage
   */
  async getCurrentUsage(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: { userId }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const usage = await this.subscriptionService.getCurrentUsage(workspaceId);

      res.status(200).json({
        success: true,
        data: { usage }
      });
    } catch (error) {
      logger.error('Failed to get current usage:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Handle Stripe webhooks
   */
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['stripe-signature'] as string;
      const payload = req.body;

      if (!signature) {
        res.status(400).json({
          success: false,
          error: 'Missing Stripe signature'
        });
        return;
      }

      await this.stripeService.processWebhook(payload, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process Stripe webhook:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Handle eWAY webhooks
   */
  async handleEwayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      const sourceIp = req.ip || req.headers['x-forwarded-for'] as string || req.connection.remoteAddress;

      // Log webhook receipt
      logger.info('Received eWAY webhook:', {
        eventType: payload.EventType,
        transactionId: payload.TransactionID,
        sourceIp
      });

      // Process webhook event
      await this.ewayService.processWebhook(payload, sourceIp);

      res.status(200).json({
        success: true,
        message: 'eWAY webhook processed successfully'
      });
    } catch (error) {
      logger.error('Failed to process eWAY webhook:', error);
      res.status(400).json({
        success: false,
        error: getErrorMessage(error)
      });
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
          error: 'Authentication required'
        });
        return;
      }

      // Check workspace access
      const workspace = await this.prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          users: {
            some: { userId }
          }
        }
      });

      if (!workspace) {
        res.status(404).json({
          success: false,
          error: 'Workspace not found or access denied'
        });
        return;
      }

      const paymentMethods = await this.prisma.paymentMethod.findMany({
        where: { workspaceId },
        orderBy: [
          { isDefault: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      res.status(200).json({
        success: true,
        data: { paymentMethods }
      });
    } catch (error) {
      logger.error('Failed to get payment methods:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }

  /**
   * Convert currency
   */
  async convertCurrency(req: Request, res: Response): Promise<void> {
    try {
      const { amount, fromCurrency, toCurrency } = req.query;

      if (!amount || !fromCurrency || !toCurrency) {
        res.status(400).json({
          success: false,
          error: 'Amount, fromCurrency, and toCurrency are required'
        });
        return;
      }

      const conversion = await this.currencyService.convertCurrency(
        parseFloat(amount as string),
        fromCurrency as string,
        toCurrency as string
      );

      res.status(200).json({
        success: true,
        data: { conversion }
      });
    } catch (error) {
      logger.error('Failed to convert currency:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
    }
  }
}