import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { StripeService } from '../services/payment/stripe.service';
import { EwayService } from '../services/payment/eway.service';
import { getErrorMessage } from '../utils/error-handler';
import { logger } from '../utils/logger';

/**
 * Controller for handling payment gateway webhooks
 */
export class WebhookController {
  private prisma: PrismaClient;
  private stripeService: StripeService;
  private ewayService: EwayService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stripeService = new StripeService();
    this.ewayService = new EwayService();
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
          error: 'Missing stripe signature'
        });
        return;
      }

      await this.stripeService.handleWebhook(payload, signature);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
      return;
    } catch (error) {
      logger.error('Failed to handle Stripe webhook:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Handle eWAY webhooks
   */
  async handleEwayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      
      await this.ewayService.handleWebhook(payload);

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
      return;
    } catch (error) {
      logger.error('Failed to handle eWAY webhook:', error);
      res.status(500).json({
        success: false,
        error: getErrorMessage(error)
      });
      return;
    }
  }
}