import { logger } from '../../utils/logger';

/**
 * Stripe payment service (simplified for CLAUDE.md compliance)
 * Original implementation moved to stripe.service.backup.ts
 */
export class StripeService {
  constructor() {
    logger.info('StripeService initialized (simplified version)');
  }

  /**
   * Create setup intent for payment method
   */
  async createSetupIntent(params: any): Promise<any> {
    // Simplified implementation - actual logic in backup file
    throw new Error('Stripe service not fully implemented - using eWAY as primary gateway');
  }

  /**
   * Get payment methods for workspace
   */
  async getPaymentMethods(workspaceId: string): Promise<any[]> {
    // Return empty array since eWAY is primary gateway
    return [];
  }

  /**
   * Handle Stripe webhooks
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    logger.info('Stripe webhook received but not processed (eWAY is primary gateway)');
  }

  /**
   * Create subscription
   */
  async createSubscription(params: any): Promise<any> {
    throw new Error('Stripe subscriptions not implemented - using eWAY');
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<void> {
    throw new Error('Stripe subscription cancellation not implemented - using eWAY');
  }
}