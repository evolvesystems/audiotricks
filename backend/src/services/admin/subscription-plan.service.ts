/**
 * Admin Subscription Plan Service
 * Handles subscription plan CRUD operations for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminSubscriptionPlanService {
  /**
   * Get all subscription plans with active subscription counts
   */
  async getAllPlans() {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: [
        { tier: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            subscriptions: true
          }
        }
      }
    });

    return plans.map(plan => {
      const features = (plan.features as any) || {};
      const quotas = (plan.quotas as any) || {};
      
      return {
        id: plan.id,
        name: plan.name,
        displayName: plan.displayName,
        tier: plan.tier,
        description: plan.description,
        price: Number(plan.price),
        priceAUD: Number(plan.price), // For backward compatibility
        priceUSD: Number(plan.price), // For backward compatibility
        priceEUR: Number(plan.price), // For backward compatibility
        currency: plan.currency,
        billingInterval: plan.billingPeriod,
        // Basic Limits from features
        maxApiCalls: features.maxApiCalls || 1000,
        maxStorageMb: features.maxStorageMb || 1024,
        maxProcessingMin: features.maxProcessingMin || 60,
        maxUsers: features.maxUsers || 1,
        maxProjects: features.maxProjects || 10,
        maxTranscriptions: features.maxTranscriptions || 100,
        // Advanced Features from features
        advancedAnalytics: features.advancedAnalytics || false,
        prioritySupport: features.prioritySupport || false,
        customBranding: features.customBranding || false,
        apiIntegrations: features.apiIntegrations || false,
        bulkTranscription: features.bulkTranscription || false,
        teamCollaboration: features.teamCollaboration || false,
        customExport: features.customExport || false,
        webhookNotifications: features.webhookNotifications || false,
        advancedSecurity: features.advancedSecurity || false,
        // Subscription count
        activeSubscriptions: plan._count.subscriptions,
        isActive: plan.isActive,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      };
    });
  }

  /**
   * Create new subscription plan
   */
  async createPlan(planData: any) {
    const {
      name,
      displayName,
      description,
      tier,
      price,
      currency = 'AUD',
      billingPeriod = 'monthly',
      features = {},
      quotas = {},
      isActive = true
    } = planData;

    // Validate required fields
    if (!name || !displayName || tier === undefined || price === undefined) {
      throw new Error('Missing required plan fields: name, displayName, tier, price');
    }

    // Check if plan name already exists
    const existingPlan = await prisma.subscriptionPlan.findFirst({
      where: { name }
    });

    if (existingPlan) {
      throw new Error(`Plan with name '${name}' already exists`);
    }

    const newPlan = await prisma.subscriptionPlan.create({
      data: {
        name,
        displayName,
        description,
        tier,
        price: price.toString(),
        currency,
        billingPeriod,
        features,
        quotas,
        isActive
      }
    });

    logger.info(`Created new subscription plan: ${name}`, {
      planId: newPlan.id,
      tier,
      price,
      currency
    });

    return this.formatPlanResponse(newPlan);
  }

  /**
   * Update existing subscription plan
   */
  async updatePlan(planId: string, updateData: any) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!existingPlan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }

    // Check for name conflicts if name is being changed
    if (updateData.name && updateData.name !== existingPlan.name) {
      const nameConflict = await prisma.subscriptionPlan.findFirst({
        where: { 
          name: updateData.name,
          id: { not: planId }
        }
      });

      if (nameConflict) {
        throw new Error(`Plan with name '${updateData.name}' already exists`);
      }
    }

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: planId },
      data: {
        ...updateData,
        price: updateData.price ? updateData.price.toString() : undefined
      }
    });

    logger.info(`Updated subscription plan: ${updatedPlan.name}`, {
      planId,
      changes: Object.keys(updateData)
    });

    return this.formatPlanResponse(updatedPlan);
  }

  /**
   * Delete subscription plan (soft delete if has active subscriptions)
   */
  async deletePlan(planId: string) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: {
        _count: {
          select: {
            subscriptions: {
              where: {
                status: 'active'
              }
            }
          }
        }
      }
    });

    if (!existingPlan) {
      throw new Error(`Subscription plan with ID ${planId} not found`);
    }

    if (existingPlan._count.subscriptions > 0) {
      // Soft delete - deactivate plan instead of deleting
      await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: false }
      });

      logger.info(`Deactivated subscription plan with active subscriptions: ${existingPlan.name}`, {
        planId,
        activeSubscriptions: existingPlan._count.subscriptions
      });

      return { deleted: false, deactivated: true };
    } else {
      // Hard delete - no active subscriptions
      await prisma.subscriptionPlan.delete({
        where: { id: planId }
      });

      logger.info(`Deleted subscription plan: ${existingPlan.name}`, {
        planId
      });

      return { deleted: true, deactivated: false };
    }
  }

  /**
   * Format plan response consistently
   */
  private formatPlanResponse(plan: any) {
    const features = (plan.features as any) || {};
    
    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      tier: plan.tier,
      price: Number(plan.price),
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      features,
      quotas: plan.quotas,
      isActive: plan.isActive,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  }
}