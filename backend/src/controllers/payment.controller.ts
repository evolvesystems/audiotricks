import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SubscriptionController } from './subscription.controller';
import { WebhookController } from './webhook.controller';
import { PaymentMethodController } from './payment-method.controller';

/**
 * Main payment controller that coordinates subscription, webhook, and payment method operations
 * This maintains backward compatibility while delegating to focused controllers
 */
export class PaymentController {
  private subscriptionController: SubscriptionController;
  private webhookController: WebhookController;
  private paymentMethodController: PaymentMethodController;

  constructor(prisma: PrismaClient) {
    this.subscriptionController = new SubscriptionController(prisma);
    this.webhookController = new WebhookController(prisma);
    this.paymentMethodController = new PaymentMethodController(prisma);
  }

  // Subscription Management
  async getPlans(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.getPlans(req, res);
  }

  async getCurrencies(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.getCurrencies(req, res);
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.createSubscription(req, res);
  }

  async getSubscription(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.getSubscription(req, res);
  }

  async updateSubscription(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.updateSubscription(req, res);
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.cancelSubscription(req, res);
  }

  async getBillingHistory(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.getBillingHistory(req, res);
  }

  async getCurrentUsage(req: Request, res: Response): Promise<void> {
    return this.subscriptionController.getCurrentUsage(req, res);
  }

  // Payment Methods
  async createSetupIntent(req: Request, res: Response): Promise<void> {
    return this.paymentMethodController.createSetupIntent(req, res);
  }

  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    return this.paymentMethodController.getPaymentMethods(req, res);
  }

  async convertCurrency(req: Request, res: Response): Promise<void> {
    return this.paymentMethodController.convertCurrency(req, res);
  }

  // Webhooks
  async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    return this.webhookController.handleStripeWebhook(req, res);
  }

  async handleEwayWebhook(req: Request, res: Response): Promise<void> {
    return this.webhookController.handleEwayWebhook(req, res);
  }
}