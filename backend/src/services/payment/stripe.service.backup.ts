import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Stripe payment service for handling subscriptions, payments, and webhooks
 */
export class StripeService {
  private stripe: Stripe;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  /**
   * Create a Stripe customer for a workspace
   */
  async createCustomer(workspaceId: string, email: string, name?: string): Promise<string> {
    try {
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: { users: { include: { user: true } } }
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      const customer = await this.stripe.customers.create({
        email,
        name: name || workspace.name,
        metadata: {
          workspaceId,
          workspaceName: workspace.name
        }
      });

      logger.info(`Created Stripe customer ${customer.id} for workspace ${workspaceId}`);
      return customer.id;
    } catch (error) {
      logger.error('Failed to create Stripe customer:', error);
      throw new Error(`Failed to create customer: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a payment method and attach it to a customer
   */
  async createPaymentMethod(
    workspaceId: string,
    customerId: string,
    paymentMethodId: string
  ): Promise<any> {
    try {
      // Attach payment method to customer
      await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Retrieve payment method details
      const paymentMethod = await this.stripe.paymentMethods.retrieve(paymentMethodId);

      // Store in database
      const savedPaymentMethod = await this.prisma.paymentMethod.create({
        data: {
          workspaceId,
          type: paymentMethod.type,
          provider: 'stripe',
          stripePaymentMethodId: paymentMethodId,
          lastFour: paymentMethod.card?.last4,
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year,
          brand: paymentMethod.card?.brand,
          country: paymentMethod.card?.country,
          isVerified: true,
          metadata: {
            stripeCustomerId: customerId,
            fingerprint: paymentMethod.card?.fingerprint
          }
        }
      });

      logger.info(`Created payment method ${savedPaymentMethod.id} for workspace ${workspaceId}`);
      return savedPaymentMethod;
    } catch (error) {
      logger.error('Failed to create payment method:', error);
      throw new Error(`Failed to create payment method: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a subscription for a workspace
   */
  async createSubscription(params: {
    workspaceId: string;
    planId: string;
    customerId: string;
    paymentMethodId: string;
    currency?: string;
    trialPeriodDays?: number;
  }): Promise<any> {
    try {
      const { workspaceId, planId, customerId, paymentMethodId, currency = 'USD', trialPeriodDays } = params;

      // Get plan pricing for the specified currency
      const planPricing = await this.prisma.planPricing.findFirst({
        where: {
          planId,
          currency,
          isActive: true
        },
        include: { plan: true }
      });

      if (!planPricing || !planPricing.stripePriceId) {
        throw new Error(`No active pricing found for plan ${planId} in currency ${currency}`);
      }

      // Set default payment method for customer
      await this.stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: planPricing.stripePriceId }],
        default_payment_method: paymentMethodId,
        trial_period_days: trialPeriodDays,
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          workspaceId,
          planId,
          currency
        }
      });

      // Calculate trial end date
      const trialEnd = trialPeriodDays 
        ? new Date(Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000)
        : null;

      // Save subscription to database
      const savedSubscription = await this.prisma.workspaceSubscription.create({
        data: {
          workspaceId,
          planId,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          trialEnd,
          paymentGateway: 'stripe',
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customerId,
          paymentMethodId,
          currency,
          amount: planPricing.price,
          metadata: {
            stripePriceId: planPricing.stripePriceId,
            stripeProductId: planPricing.stripeProductId
          }
        }
      });

      logger.info(`Created subscription ${savedSubscription.id} for workspace ${workspaceId}`);
      return { subscription: savedSubscription, stripeSubscription: subscription };
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error(`Failed to create subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const dbSubscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription || !dbSubscription.stripeSubscriptionId) {
        throw new Error('Subscription not found');
      }

      // Cancel at period end in Stripe
      await this.stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
        metadata: {
          cancelReason: reason || 'User requested cancellation'
        }
      });

      // Update database
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          cancelledAt: new Date(),
          cancelReason: reason
        }
      });

      logger.info(`Cancelled subscription ${subscriptionId}`);
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(subscriptionId: string, newPlanId: string, currency?: string): Promise<void> {
    try {
      const dbSubscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!dbSubscription || !dbSubscription.stripeSubscriptionId) {
        throw new Error('Subscription not found');
      }

      // Get new plan pricing
      const planPricing = await this.prisma.planPricing.findFirst({
        where: {
          planId: newPlanId,
          currency: currency || dbSubscription.currency,
          isActive: true
        }
      });

      if (!planPricing || !planPricing.stripePriceId) {
        throw new Error(`No active pricing found for plan ${newPlanId}`);
      }

      // Get current subscription from Stripe
      const stripeSubscription = await this.stripe.subscriptions.retrieve(
        dbSubscription.stripeSubscriptionId
      );

      // Update subscription in Stripe
      await this.stripe.subscriptions.update(dbSubscription.stripeSubscriptionId, {
        items: [{
          id: stripeSubscription.items.data[0].id,
          price: planPricing.stripePriceId,
        }],
        proration_behavior: 'create_prorations',
      });

      // Update database
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          amount: planPricing.price,
          currency: currency || dbSubscription.currency
        }
      });

      logger.info(`Updated subscription ${subscriptionId} to plan ${newPlanId}`);
    } catch (error) {
      logger.error('Failed to update subscription:', error);
      throw new Error(`Failed to update subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a setup intent for saving payment method
   */
  async createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      });

      return setupIntent;
    } catch (error) {
      logger.error('Failed to create setup intent:', error);
      throw new Error(`Failed to create setup intent: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a payment intent for one-time payments
   */
  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        customer: params.customerId,
        payment_method: params.paymentMethodId,
        confirmation_method: 'manual',
        confirm: !!params.paymentMethodId,
        description: params.description,
        metadata: params.metadata || {}
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to create payment intent:', error);
      throw new Error(`Failed to create payment intent: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Retrieve customer from Stripe
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        throw new Error('Customer has been deleted');
      }
      return customer as Stripe.Customer;
    } catch (error) {
      logger.error('Failed to retrieve customer:', error);
      throw new Error(`Failed to retrieve customer: ${getErrorMessage(error)}`);
    }
  }

  /**
   * List payment methods for a customer
   */
  async listPaymentMethods(customerId: string, type: string = 'card'): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type as Stripe.PaymentMethodListParams.Type
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to list payment methods:', error);
      throw new Error(`Failed to list payment methods: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get subscription from Stripe
   */
  async getStripeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['latest_invoice.payment_intent']
      });
    } catch (error) {
      logger.error('Failed to retrieve Stripe subscription:', error);
      throw new Error(`Failed to retrieve subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get upcoming invoice for a subscription
   */
  async getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice> {
    try {
      return await this.stripe.invoices.retrieveUpcoming({
        customer: customerId
      });
    } catch (error) {
      logger.error('Failed to retrieve upcoming invoice:', error);
      throw new Error(`Failed to retrieve upcoming invoice: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Process a webhook event
   */
  async processWebhook(payload: string, signature: string): Promise<void> {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
      // Store webhook event
      await this.prisma.paymentGatewayWebhook.create({
        data: {
          gateway: 'stripe',
          eventType: event.type,
          eventId: event.id,
          payload: event as any,
          signature,
          status: 'pending'
        }
      });

      await this.handleWebhookEvent(event);
    } catch (error) {
      logger.error('Failed to process webhook:', error);
      throw error;
    }
  }

  /**
   * Handle specific webhook events
   */
  private async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'subscription.updated':
        case 'subscription.created':
          await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
          break;

        case 'subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;

        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        case 'customer.subscription.trial_will_end':
          await this.handleTrialWillEnd(event.data.object as Stripe.Subscription);
          break;

        default:
          logger.info(`Unhandled webhook event type: ${event.type}`);
      }

      // Mark webhook as processed
      await this.prisma.paymentGatewayWebhook.updateMany({
        where: { eventId: event.id },
        data: { 
          status: 'processed',
          processedAt: new Date()
        }
      });
    } catch (error) {
      logger.error(`Failed to handle webhook event ${event.type}:`, error);
      
      // Mark webhook as failed
      await this.prisma.paymentGatewayWebhook.updateMany({
        where: { eventId: event.id },
        data: { 
          status: 'failed',
          errorMessage: getErrorMessage(error)
        }
      });
      
      throw error;
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const workspaceId = subscription.metadata.workspaceId;
    if (!workspaceId) return;

    await this.prisma.workspaceSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null
      }
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await this.prisma.workspaceSubscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await this.prisma.workspaceSubscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string }
    });

    if (subscription) {
      await this.prisma.billingRecord.create({
        data: {
          subscriptionId: subscription.id,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency.toUpperCase(),
          status: 'paid',
          paymentGateway: 'stripe',
          stripeInvoiceId: invoice.id,
          stripePaymentIntentId: invoice.payment_intent as string,
          paidAt: new Date(invoice.status_transitions.paid_at! * 1000),
          invoiceUrl: invoice.hosted_invoice_url
        }
      });
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscription = await this.prisma.workspaceSubscription.findFirst({
      where: { stripeSubscriptionId: invoice.subscription as string }
    });

    if (subscription) {
      await this.prisma.billingRecord.create({
        data: {
          subscriptionId: subscription.id,
          amount: invoice.amount_due / 100,
          currency: invoice.currency.toUpperCase(),
          status: 'failed',
          paymentGateway: 'stripe',
          stripeInvoiceId: invoice.id,
          failureReason: 'Payment failed',
          dueAt: new Date(invoice.due_date! * 1000)
        }
      });

      // Update subscription status
      await this.prisma.workspaceSubscription.update({
        where: { id: subscription.id },
        data: { status: 'past_due' }
      });
    }
  }

  private async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    // Could send notification to workspace users about trial ending
    logger.info(`Trial ending soon for subscription ${subscription.id}`);
  }
}