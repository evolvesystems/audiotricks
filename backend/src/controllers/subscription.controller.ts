import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../services/subscription/subscription.service';
import { getErrorMessage } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Controller for subscription management operations
 */
export class SubscriptionController {
  private subscriptionService: SubscriptionService;

  constructor(prisma: PrismaClient) {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Get available subscription plans
   */
  async getPlans(req: Request, res: Response): Promise<void> {
    try {
      const { currency = 'AUD', region } = req.query;
      
      const plans = await this.subscriptionService.getAvailablePlans(
        currency as string
      );

      res.status(200).json({
        success: true,
        data: { plans }
      });
      return;
    } catch (error) {
      logger.error('Failed to get plans:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Get supported currencies
   */
  async getCurrencies(req: Request, res: Response): Promise<void> {
    try {
      const currencies = await this.subscriptionService.getCurrencies();

      res.status(200).json({
        success: true,
        data: { currencies }
      });
      return;
    } catch (error) {
      logger.error('Failed to get currencies:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { workspaceId, planId, paymentMethodId, currency, paymentGateway, customerEmail, customerName } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const subscription = await this.subscriptionService.createSubscription({
        workspaceId,
        planId,
        paymentMethodId,
        currency: currency || 'AUD',
        paymentGateway: paymentGateway || 'eway',
        customerEmail,
        customerName
      });

      res.status(201).json({
        success: true,
        data: { subscription }
      });
      return;
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
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
          error: 'User authentication required'
        });
        return;
      }

      const subscription = await this.subscriptionService.getWorkspaceSubscription(workspaceId);

      if (!subscription) {
        res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { subscription }
      });
      return;
    } catch (error) {
      logger.error('Failed to get subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { newPlanId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      const subscription = await this.subscriptionService.updateSubscriptionPlan(
        subscriptionId,
        newPlanId
      );

      res.status(200).json({
        success: true,
        data: { subscription }
      });
      return;
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const { subscriptionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User authentication required'
        });
        return;
      }

      await this.subscriptionService.cancelSubscription(subscriptionId, reason);

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
      return;
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
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
          error: 'User authentication required'
        });
        return;
      }

      const billingHistory = await this.subscriptionService.getBillingHistory(
        workspaceId,
        parseInt(limit as string) || 10
      );

      res.status(200).json({
        success: true,
        data: { billingHistory }
      });
      return;
    } catch (error) {
      logger.error('Failed to get billing history:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Get current usage for workspace
   */
  async getCurrentUsage(req: Request, res: Response): Promise<void> {
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

      const usage = await this.subscriptionService.getCurrentUsage(workspaceId);

      res.status(200).json({
        success: true,
        data: { usage }
      });
      return;
    } catch (error) {
      logger.error('Failed to get current usage:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }
}