import { PrismaClient } from '@prisma/client';
import { EwayService } from '../payment/eway.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

export interface CreateSubscriptionParams {
  workspaceId: string;
  planId: string;
  paymentMethodId: string;
  currency?: string;
  paymentGateway?: 'eway' | 'stripe';
  customerEmail: string;
  customerName?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: string;
  features: any;
  quotas: any;
  pricing: {
    currency: string;
    price: number;
    billingPeriod: string;
  }[];
  trialDays: number;
  isActive: boolean;
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
 * Subscription management service
 * Handles subscription lifecycle, billing, and plan management
 */
export class SubscriptionService {
  private prisma: PrismaClient;
  private ewayService: EwayService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.ewayService = new EwayService();
  }

  /**
   * Get available subscription plans with pricing for a specific currency
   */
  async getAvailablePlans(currency: string = 'AUD', region?: string): Promise<SubscriptionPlan[]> {
    try {
      const plans = await this.prisma.subscriptionPlan.findMany({
        where: {
          isActive: true,
          isPublic: true
        },
        include: {
          planPricing: {
            where: {
              currency,
              isActive: true,
              ...(region && { region })
            }
          },
          planFeatures: {
            include: {
              featureFlag: true
            }
          }
        },
        orderBy: { sortOrder: 'asc' }
      });

      return plans.map(plan => {
        // Build quotas object from granular limits
        const quotas = {
          maxApiCalls: Number(plan.maxApiCalls),
          maxTokens: Number(plan.maxTokens),
          maxStorageMb: Number(plan.maxStorageMb),
          maxProcessingMin: Number(plan.maxProcessingMin),
          maxWorkspaces: plan.maxWorkspaces,
          maxUsers: plan.maxUsers,
          maxFileSize: Number(plan.maxFileSize),
          maxTranscriptionsMonthly: Number(plan.maxTranscriptionsMonthly),
          maxFilesDaily: plan.maxFilesDaily,
          maxFilesMonthly: plan.maxFilesMonthly,
          maxConcurrentJobs: plan.maxConcurrentJobs,
          maxVoiceSynthesisMonthly: Number(plan.maxVoiceSynthesisMonthly),
          maxExportOperationsMonthly: plan.maxExportOperationsMonthly,
          maxAudioDurationMinutes: plan.maxAudioDurationMinutes,
          priorityLevel: plan.priorityLevel
        };

        // Extract enabled features
        const enabledFeatures = plan.planFeatures
          .filter(pf => pf.isEnabled)
          .map(pf => pf.featureFlag.featureName);

        return {
          id: plan.id,
          name: plan.name,
          displayName: plan.displayName,
          description: plan.description || undefined,
          tier: plan.tier,
          features: [...plan.features as string[], ...enabledFeatures],
          quotas,
          pricing: plan.planPricing.map(pricing => ({
            currency: pricing.currency,
            price: Number(pricing.price),
            billingPeriod: pricing.billingPeriod
          })),
          trialDays: plan.trialDays,
          isActive: plan.isActive
        };
      });
    } catch (error) {
      logger.error('Failed to get available plans:', error);
      throw new Error(`Failed to get plans: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<any[]> {
    try {
      return await this.prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });
    } catch (error) {
      logger.error('Failed to get supported currencies:', error);
      throw new Error(`Failed to get currencies: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionDetails> {
    try {
      const { workspaceId, planId, paymentMethodId, currency = 'AUD', paymentGateway = 'eway', customerEmail, customerName } = params;

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
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          planPricing: {
            where: { 
              currency, 
              isActive: true,
              billingPeriod: 'monthly' // Default to monthly for subscription creation
            }
          }
        }
      });

      if (!plan || !plan.isActive) {
        throw new Error('Plan not found or inactive');
      }

      const pricing = plan.planPricing[0];
      if (!pricing) {
        throw new Error(`Plan not available in currency ${currency}`);
      }

      // Create subscription based on payment gateway
      let subscription;
      if (paymentGateway === 'eway') {
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
        subscription = await this.prisma.workspaceSubscription.create({
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
            currency,
            amount: pricing.price
          }
        });

        // Create recurring schedule for billing
        if (plan.trialDays === 0) {
          await this.ewayService.createRecurringSchedule({
            tokenCustomerId: ownerUser.id,
            amount: Number(pricing.price),
            currency: currency,
            frequency: pricing.billingPeriod === 'yearly' ? 'Yearly' : 'Monthly',
            startDate: new Date(),
            invoiceDescription: `Subscription for ${plan.name}`
          });
        }
      } else {
        throw new Error(`Payment gateway ${paymentGateway} not yet implemented`);
      }

      // Return subscription details
      return await this.getSubscriptionDetails(subscription.id);
    } catch (error) {
      logger.error('Failed to create subscription:', error);
      throw new Error(`Failed to create subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get subscription details for a workspace
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
        }
      });

      if (!subscription) {
        return null;
      }

      return await this.getSubscriptionDetails(subscription.id);
    } catch (error) {
      logger.error('Failed to get workspace subscription:', error);
      throw new Error(`Failed to get subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get detailed subscription information
   */
  async getSubscriptionDetails(subscriptionId: string): Promise<SubscriptionDetails> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId },
        include: {
          plan: {
            include: {
              planPricing: true
            }
          }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get next invoice - for eWAY this would be based on the recurring schedule
      let nextInvoice;
      if (subscription.paymentGateway === 'eway') {
        // For eWAY, get next billing date from recurring schedule
        const recurringSchedule = await this.prisma.ewayRecurringSchedule.findFirst({
          where: { subscriptionId: subscription.id, status: 'active' }
        });
        
        if (recurringSchedule) {
          nextInvoice = {
            amount: Number(recurringSchedule.billingAmount),
            date: recurringSchedule.nextBillingDate
          };
        }
      }

      // Build quotas object from enhanced schema
      const quotas = {
        maxApiCalls: Number(subscription.plan.maxApiCalls),
        maxTokens: Number(subscription.plan.maxTokens),
        maxStorageMb: Number(subscription.plan.maxStorageMb),
        maxProcessingMin: Number(subscription.plan.maxProcessingMin),
        maxWorkspaces: subscription.plan.maxWorkspaces,
        maxUsers: subscription.plan.maxUsers,
        maxFileSize: Number(subscription.plan.maxFileSize),
        maxTranscriptionsMonthly: Number(subscription.plan.maxTranscriptionsMonthly),
        maxFilesDaily: subscription.plan.maxFilesDaily,
        maxFilesMonthly: subscription.plan.maxFilesMonthly,
        maxConcurrentJobs: subscription.plan.maxConcurrentJobs,
        maxVoiceSynthesisMonthly: Number(subscription.plan.maxVoiceSynthesisMonthly),
        maxExportOperationsMonthly: subscription.plan.maxExportOperationsMonthly,
        maxAudioDurationMinutes: subscription.plan.maxAudioDurationMinutes,
        priorityLevel: subscription.plan.priorityLevel
      };

      const plan: SubscriptionPlan = {
        id: subscription.plan.id,
        name: subscription.plan.name,
        displayName: subscription.plan.displayName,
        description: subscription.plan.description || undefined,
        tier: subscription.plan.tier,
        features: subscription.plan.features as any,
        quotas,
        pricing: subscription.plan.planPricing.map(pricing => ({
          currency: pricing.currency,
          price: Number(pricing.price),
          billingPeriod: pricing.billingPeriod
        })),
        trialDays: subscription.plan.trialDays,
        isActive: subscription.plan.isActive
      };

      return {
        id: subscription.id,
        workspaceId: subscription.workspaceId,
        plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEnd: subscription.trialEnd || undefined,
        cancelledAt: subscription.cancelledAt || undefined,
        currency: subscription.currency,
        amount: Number(subscription.amount),
        paymentGateway: subscription.paymentGateway,
        nextInvoice
      };
    } catch (error) {
      logger.error('Failed to get subscription details:', error);
      throw new Error(`Failed to get subscription details: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string): Promise<SubscriptionDetails> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.paymentGateway === 'eway') {
        // For eWAY, we need to update the recurring schedule with new plan pricing
        const newPlan = await this.prisma.subscriptionPlan.findUnique({
          where: { id: newPlanId },
          include: {
            planPricing: {
              where: { 
                currency: subscription.currency,
                billingPeriod: 'monthly',
                isActive: true 
              }
            }
          }
        });

        if (!newPlan || !newPlan.planPricing[0]) {
          throw new Error('New plan or pricing not found');
        }

        // Update subscription
        await this.prisma.workspaceSubscription.update({
          where: { id: subscriptionId },
          data: {
            planId: newPlanId,
            amount: newPlan.planPricing[0].price
          }
        });

        // Update recurring schedule if exists
        await this.prisma.ewayRecurringSchedule.updateMany({
          where: { subscriptionId },
          data: {
            billingAmount: newPlan.planPricing[0].price
          }
        });
      } else {
        throw new Error(`Plan updates not supported for ${subscription.paymentGateway}`);
      }

      return await this.getSubscriptionDetails(subscriptionId);
    } catch (error) {
      logger.error('Failed to update subscription plan:', error);
      throw new Error(`Failed to update plan: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.paymentGateway === 'eway') {
        // Cancel eWAY recurring schedule
        const recurringSchedule = await this.prisma.ewayRecurringSchedule.findFirst({
          where: { subscriptionId }
        });

        if (recurringSchedule) {
          await this.ewayService.cancelRecurringSchedule(recurringSchedule.id);
        }

        // Update subscription status
        await this.prisma.workspaceSubscription.update({
          where: { id: subscriptionId },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancelReason: reason
          }
        });
      } else {
        throw new Error(`Cancellation not supported for ${subscription.paymentGateway}`);
      }

      logger.info(`Cancelled subscription ${subscriptionId}`);
    } catch (error) {
      logger.error('Failed to cancel subscription:', error);
      throw new Error(`Failed to cancel subscription: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get billing history for a workspace
   */
  async getBillingHistory(workspaceId: string, limit: number = 10): Promise<any[]> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId }
      });

      if (!subscription) {
        return [];
      }

      const billingRecords = await this.prisma.billingRecord.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return billingRecords.map(record => ({
        id: record.id,
        amount: Number(record.amount),
        currency: record.currency,
        status: record.status,
        invoiceNumber: record.invoiceNumber,
        invoiceUrl: record.invoiceUrl,
        paymentMethod: record.paymentMethod,
        paidAt: record.paidAt,
        createdAt: record.createdAt,
        failureReason: record.failureReason
      }));
    } catch (error) {
      logger.error('Failed to get billing history:', error);
      throw new Error(`Failed to get billing history: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get usage for current billing period
   */
  async getCurrentUsage(workspaceId: string): Promise<any> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId },
        include: { plan: true }
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      // Get usage for current period
      const usage = await this.prisma.usageRecord.findMany({
        where: {
          subscriptionId: subscription.id,
          periodStart: { gte: subscription.currentPeriodStart },
          periodEnd: { lte: subscription.currentPeriodEnd }
        }
      });

      // Aggregate usage by type
      const usageByType = usage.reduce((acc, record) => {
        const type = record.recordType;
        if (!acc[type]) {
          acc[type] = {
            quantity: 0,
            cost: 0
          };
        }
        acc[type].quantity += Number(record.quantity);
        acc[type].cost += Number(record.totalCost || 0);
        return acc;
      }, {} as Record<string, { quantity: number; cost: number }>);

      // Get plan limits
      const planLimits = {
        maxApiCalls: subscription.plan.maxApiCalls,
        maxStorageMb: subscription.plan.maxStorageMb,
        maxProcessingMin: subscription.plan.maxProcessingMin
      };

      return {
        subscriptionId: subscription.id,
        planName: subscription.plan.displayName,
        currentPeriod: {
          start: subscription.currentPeriodStart,
          end: subscription.currentPeriodEnd
        },
        usage: usageByType,
        quotas,
        totalCost: Object.values(usageByType).reduce((sum, u) => sum + u.cost, 0)
      };
    } catch (error) {
      logger.error('Failed to get current usage:', error);
      throw new Error(`Failed to get usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if workspace has active subscription
   */
  async hasActiveSubscription(workspaceId: string): Promise<boolean> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: {
          workspaceId,
          status: { in: ['active', 'trialing'] }
        }
      });

      return !!subscription;
    } catch (error) {
      logger.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get plan limits for a workspace
   */
  async getWorkspaceLimits(workspaceId: string): Promise<any> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId },
        include: { plan: true }
      });

      if (!subscription) {
        // Return default free limits
        return {
          maxApiCalls: 100,
          maxTokens: 10000,
          maxStorageMb: 100,
          maxProcessingMin: 30,
          maxWorkspaces: 1,
          maxUsers: 1,
          maxFileSize: 26214400,
          maxTranscriptionsMonthly: 25,
          maxFilesDaily: 3,
          maxFilesMonthly: 50,
          maxConcurrentJobs: 1,
          maxVoiceSynthesisMonthly: 0,
          maxExportOperationsMonthly: 5,
          maxAudioDurationMinutes: 30,
          priorityLevel: 3
        };
      }

      return {
        maxApiCalls: Number(subscription.plan.maxApiCalls),
        maxTokens: Number(subscription.plan.maxTokens),
        maxStorageMb: Number(subscription.plan.maxStorageMb),
        maxProcessingMin: Number(subscription.plan.maxProcessingMin),
        maxWorkspaces: subscription.plan.maxWorkspaces,
        maxUsers: subscription.plan.maxUsers,
        maxFileSize: Number(subscription.plan.maxFileSize),
        maxTranscriptionsMonthly: Number(subscription.plan.maxTranscriptionsMonthly),
        maxFilesDaily: subscription.plan.maxFilesDaily,
        maxFilesMonthly: subscription.plan.maxFilesMonthly,
        maxConcurrentJobs: subscription.plan.maxConcurrentJobs,
        maxVoiceSynthesisMonthly: Number(subscription.plan.maxVoiceSynthesisMonthly),
        maxExportOperationsMonthly: subscription.plan.maxExportOperationsMonthly,
        maxAudioDurationMinutes: subscription.plan.maxAudioDurationMinutes,
        priorityLevel: subscription.plan.priorityLevel
      };
    } catch (error) {
      logger.error('Failed to get workspace limits:', error);
      throw new Error(`Failed to get limits: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Record usage for billing
   */
  async recordUsage(params: {
    workspaceId: string;
    recordType: string;
    quantity: number;
    unitPrice?: number;
    metadata?: any;
  }): Promise<void> {
    try {
      const { workspaceId, recordType, quantity, unitPrice, metadata } = params;

      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { workspaceId }
      });

      if (!subscription) {
        // No subscription, skip usage recording
        return;
      }

      const totalCost = unitPrice ? quantity * unitPrice : null;

      await this.prisma.usageRecord.create({
        data: {
          subscriptionId: subscription.id,
          recordType,
          quantity,
          unitPrice,
          totalCost,
          periodStart: subscription.currentPeriodStart,
          periodEnd: subscription.currentPeriodEnd,
          metadata: metadata || {}
        }
      });

      logger.debug(`Recorded usage: ${recordType} = ${quantity} for workspace ${workspaceId}`);
    } catch (error) {
      logger.error('Failed to record usage:', error);
      // Don't throw error to avoid breaking business logic
    }
  }
}