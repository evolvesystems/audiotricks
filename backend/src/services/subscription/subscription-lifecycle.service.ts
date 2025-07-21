import { PrismaClient } from '@prisma/client';
import { EwayService } from '../payment/eway.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import { PlanService, SubscriptionPlan } from './plan.service';

export interface CreateSubscriptionParams {
  workspaceId: string;
  planId: string;
  paymentMethodId: string;
  currency?: string;
  paymentGateway?: 'eway' | 'stripe';
  customerEmail: string;
  customerName?: string;
}

export interface SubscriptionDetails {
  id: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelledAt?: Date;
  currency: string;
  amount: number;
  paymentGateway: string;
  nextInvoice?: {
    amount: number;
    date: Date;
  };
}

/**
 * Service for managing subscription lifecycle operations
 */
export class SubscriptionLifecycleService {
  private prisma: PrismaClient;
  private ewayService: EwayService;
  private planService: PlanService;

  constructor() {
    this.prisma = new PrismaClient();
    this.ewayService = new EwayService();
    this.planService = new PlanService();
  }

  /**
   * Create a new subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionDetails> {
    try {
      const { workspaceId, planId, paymentMethodId, currency = 'AUD', paymentGateway = 'eway', customerEmail, customerName } = params;

      logger.info('Creating subscription', { workspaceId, planId, paymentGateway });

      // Verify workspace exists and user has permission
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          subscriptions: true
        }
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }

      if (workspace.subscriptions.length > 0) {
        throw new Error('Workspace already has an active subscription');
      }

      // Get plan details
      const plan = await this.planService.getPlanById(planId, currency);
      if (!plan || !plan.isActive) {
        throw new Error('Plan not found or inactive');
      }

      const pricing = plan.pricing.find(p => p.currency === currency && p.billingPeriod === 'monthly');
      if (!pricing) {
        throw new Error(`Plan not available in currency ${currency}`);
      }

      // Create subscription based on payment gateway
      let subscription;
      if (paymentGateway === 'eway') {
        subscription = await this.createEwaySubscription({
          workspaceId,
          planId,
          plan,
          pricing,
          paymentMethodId,
          customerEmail,
          customerName,
          workspace
        });
      } else {
        throw new Error('Unsupported payment gateway');
      }

      logger.info('Subscription created successfully', { subscriptionId: subscription.id });

      return await this.getSubscriptionDetails(subscription.id);
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw new Error(`Failed to create subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get workspace subscription details
   */
  async getWorkspaceSubscription(workspaceId: string): Promise<SubscriptionDetails | null> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId },
        include: {
          plan: {
            include: {
              planPricing: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!subscription) {
        return null;
      }

      return this.transformSubscriptionData(subscription);
    } catch (error) {
      logger.error('Error getting workspace subscription:', error);
      throw new Error(`Failed to get subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get subscription details by ID
   */
  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: {
            include: {
              planPricing: true,
              features: {
                include: {
                  feature: true
                }
              }
            }
          },
          workspace: true
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return this.transformSubscriptionData(subscription);
    } catch (error) {
      logger.error('Error getting subscription details:', error);
      throw new Error(`Failed to get subscription details: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string): Promise<SubscriptionDetails> {
    try {
      logger.info('Updating subscription plan', { subscriptionId, newPlanId });

      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newPlan = await this.planService.getPlanById(newPlanId, subscription.currency);
      if (!newPlan || !newPlan.isActive) {
        throw new Error('New plan not found or inactive');
      }

      const newPricing = newPlan.pricing.find(p => p.currency === subscription.currency);
      if (!newPricing) {
        throw new Error('New plan not available in current currency');
      }

      // Update subscription
      const updatedSubscription = await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          amount: newPricing.price,
          updatedAt: new Date()
        }
      });

      logger.info('Subscription plan updated successfully', { subscriptionId });

      return await this.getSubscriptionDetails(subscriptionId);
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      throw new Error(`Failed to update subscription plan: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      logger.info('Cancelling subscription', { subscriptionId, reason });

      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status === 'cancelled') {
        throw new Error('Subscription is already cancelled');
      }

      // Update subscription status
      await this.prisma.workspaceSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
          updatedAt: new Date()
        }
      });

      // Cancel recurring payments if using eWAY
      if (subscription.paymentGateway === 'eway' && subscription.ewayScheduleId) {
        try {
          await this.ewayService.cancelRecurringSchedule(subscription.ewayScheduleId);
        } catch (ewayError) {
          logger.error('Error cancelling eWAY schedule:', ewayError);
          // Don't fail the whole cancellation if eWAY cancellation fails
        }
      }

      logger.info('Subscription cancelled successfully', { subscriptionId });
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw new Error(`Failed to cancel subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get subscription status badge information
   */
  getStatusBadge(status: string): { text: string; color: string } {
    const badges = {
      'active': { text: 'Active', color: 'green' },
      'trialing': { text: 'Trial', color: 'blue' },
      'past_due': { text: 'Past Due', color: 'orange' },
      'cancelled': { text: 'Cancelled', color: 'red' },
      'unpaid': { text: 'Unpaid', color: 'red' },
      'incomplete': { text: 'Incomplete', color: 'orange' }
    };
    
    return badges[status as keyof typeof badges] || { text: status, color: 'gray' };
  }

  /**
   * Calculate days until trial end
   */
  getDaysUntilTrialEnd(trialEnd: Date): number {
    const now = new Date();
    const diff = trialEnd.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Create eWAY subscription
   */
  private async createEwaySubscription(params: any): Promise<any> {
    const { workspaceId, planId, plan, pricing, paymentMethodId, customerEmail, customerName, workspace } = params;

    // Get workspace users to find the owner
    const workspaceUsers = await this.prisma.workspaceUser.findMany({
      where: { workspaceId },
      include: { user: true }
    });

    const ownerUser = workspaceUsers.find(wu => wu.role === 'owner')?.user || workspaceUsers[0]?.user;
    if (!ownerUser) {
      throw new Error('No user found for workspace');
    }

    // Create eWAY token customer if not exists
    const existingCustomer = await this.prisma.ewayCustomer.findFirst({
      where: { 
        userId: ownerUser.id,
        isActive: true 
      }
    });

    let tokenCustomerId = existingCustomer?.ewayCustomerToken;
    if (!tokenCustomerId) {
      tokenCustomerId = await this.ewayService.createTokenCustomer({
        userId: ownerUser.id,
        firstName: customerName?.split(' ')[0] || '',
        lastName: customerName?.split(' ')[1] || '',
        email: customerEmail,
        companyName: workspace.name,
        reference: workspaceId
      });
    }

    // Create subscription record
    return await this.prisma.workspaceSubscription.create({
      data: {
        workspaceId,
        planId,
        status: plan.trialDays > 0 ? 'trialing' : 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (plan.trialDays > 0 ? plan.trialDays * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)),
        trialEnd: plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000) : null,
        paymentGateway: 'eway',
        ewayCustomerId: tokenCustomerId,
        paymentMethodId,
        currency: pricing.currency,
        amount: pricing.price
      }
    });
  }

  /**
   * Transform subscription data to SubscriptionDetails interface
   */
  private transformSubscriptionData(subscription: any): SubscriptionDetails {
    const plan = this.planService.getPlanById ? subscription.plan : subscription.plan;

    return {
      id: subscription.id,
      workspaceId: subscription.workspaceId,
      plan: {
        id: subscription.plan.id,
        name: subscription.plan.name,
        displayName: subscription.plan.displayName,
        description: subscription.plan.description,
        tier: subscription.plan.tier,
        features: subscription.plan.features || {},
        quotas: subscription.plan.quotas || {},
        pricing: subscription.plan.planPricing?.map((p: any) => ({
          currency: p.currency,
          price: Number(p.price),
          billingPeriod: p.billingPeriod
        })) || [],
        trialDays: subscription.plan.trialDays || 0,
        isActive: subscription.plan.isActive
      },
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEnd: subscription.trialEnd,
      cancelledAt: subscription.cancelledAt,
      currency: subscription.currency,
      amount: Number(subscription.amount),
      paymentGateway: subscription.paymentGateway,
      nextInvoice: subscription.nextInvoiceAmount ? {
        amount: Number(subscription.nextInvoiceAmount),
        date: subscription.nextInvoiceDate
      } : undefined
    };
  }
}