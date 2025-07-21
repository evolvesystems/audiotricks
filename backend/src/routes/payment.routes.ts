import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentController } from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { raw } from 'express';

/**
 * Payment routes for subscription management, billing, and webhooks
 */
export function createPaymentRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const paymentController = new PaymentController(prisma);

  // Public routes
  
  /**
   * GET /api/payment/plans
   * Get available subscription plans
   * Query params: currency (optional), region (optional)
   */
  router.get('/plans', paymentController.getPlans.bind(paymentController));

  /**
   * GET /api/payment/currencies
   * Get supported currencies
   */
  router.get('/currencies', paymentController.getCurrencies.bind(paymentController));

  /**
   * GET /api/payment/convert
   * Convert currency
   * Query params: amount, fromCurrency, toCurrency
   */
  router.get('/convert', paymentController.convertCurrency.bind(paymentController));

  // Webhook routes (no authentication needed)
  
  /**
   * POST /api/payment/webhooks/stripe
   * Handle Stripe webhooks
   * Special middleware to parse raw body for signature verification
   */
  router.post(
    '/webhooks/stripe',
    raw({ type: 'application/json' }),
    paymentController.handleStripeWebhook.bind(paymentController)
  );

  /**
   * POST /api/payment/webhooks/eway
   * Handle eWAY webhooks
   * Special middleware to parse raw body for verification
   */
  router.post(
    '/webhooks/eway',
    raw({ type: 'application/json' }),
    paymentController.handleEwayWebhook.bind(paymentController)
  );

  // Protected routes (require authentication)
  
  /**
   * POST /api/payment/workspaces/:workspaceId/setup-intent
   * Create payment setup intent for saving payment method
   */
  router.post(
    '/workspaces/:workspaceId/setup-intent',
    authenticate,
    paymentController.createSetupIntent.bind(paymentController)
  );

  /**
   * GET /api/payment/workspaces/:workspaceId/subscription
   * Get workspace subscription details
   */
  router.get(
    '/workspaces/:workspaceId/subscription',
    authenticate,
    paymentController.getSubscription.bind(paymentController)
  );

  /**
   * POST /api/payment/workspaces/:workspaceId/subscription
   * Create new subscription for workspace
   * Body: { planId, paymentMethodId, currency? }
   */
  router.post(
    '/workspaces/:workspaceId/subscription',
    authenticate,
    paymentController.createSubscription.bind(paymentController)
  );

  /**
   * PUT /api/payment/workspaces/:workspaceId/subscription
   * Update subscription plan
   * Body: { planId }
   */
  router.put(
    '/workspaces/:workspaceId/subscription',
    authenticate,
    paymentController.updateSubscription.bind(paymentController)
  );

  /**
   * DELETE /api/payment/workspaces/:workspaceId/subscription
   * Cancel subscription
   * Body: { reason? }
   */
  router.delete(
    '/workspaces/:workspaceId/subscription',
    authenticate,
    paymentController.cancelSubscription.bind(paymentController)
  );

  /**
   * GET /api/payment/workspaces/:workspaceId/billing
   * Get billing history
   * Query params: limit (optional, default: 10)
   */
  router.get(
    '/workspaces/:workspaceId/billing',
    authenticate,
    paymentController.getBillingHistory.bind(paymentController)
  );

  /**
   * GET /api/payment/workspaces/:workspaceId/usage
   * Get current usage for billing period
   */
  router.get(
    '/workspaces/:workspaceId/usage',
    authenticate,
    paymentController.getCurrentUsage.bind(paymentController)
  );

  /**
   * GET /api/payment/workspaces/:workspaceId/payment-methods
   * Get payment methods for workspace
   */
  router.get(
    '/workspaces/:workspaceId/payment-methods',
    authenticate,
    paymentController.getPaymentMethods.bind(paymentController)
  );

  return router;
}