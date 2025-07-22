/**
 * Admin subscription management controller
 * Handles admin operations for subscription plans, billing, and analytics
 */

import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

export class AdminSubscriptionController {
  /**
   * Get all subscription plans for admin management
   */
  async getSubscriptionPlans(_req: Request, res: Response) {
    try {
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

      res.json({
        plans: plans.map(plan => {
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
            maxFileSize: features.maxFileSize || 157286400,
            maxWorkspaces: features.maxWorkspaces || 1,
            maxUsers: features.maxUsers || 1,
            priorityLevel: features.priorityLevel || 5,
            features: features.basicFeatures || [],
            collaborationFeatures: features.collaborationFeatures || [],
            planCategory: features.planCategory || 'personal',
            // Quotas
            maxTranscriptionsMonthly: quotas.maxTranscriptionsMonthly || 50,
            maxFilesDaily: quotas.maxFilesDaily || 10,
            maxFilesMonthly: quotas.maxFilesMonthly || 100,
            maxAudioDurationMinutes: quotas.maxAudioDurationMinutes || 120,
            maxConcurrentJobs: quotas.maxConcurrentJobs || 1,
            maxVoiceSynthesisMonthly: quotas.maxVoiceSynthesisMonthly || 10,
            maxExportOperationsMonthly: quotas.maxExportOperationsMonthly || 50,
            // Legacy fields for compatibility
            audioProcessingLimit: quotas.maxTranscriptionsMonthly || 50,
            storageLimit: (features.maxStorageMb || 1024) / 1024, // Convert to GB
            apiCallsLimit: features.maxApiCalls || 1000,
            advancedFeatures: (features.basicFeatures || []).length > 0,
            customBranding: (features.collaborationFeatures || []).includes('customBranding'),
            prioritySupport: (features.collaborationFeatures || []).includes('prioritySupport'),
            // Status
            isActive: plan.isActive,
            isPublic: plan.isPublic,
            activeSubscriptions: plan._count.subscriptions,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt
          };
        })
      });
    } catch (error) {
      logger.error('Failed to fetch subscription plans for admin:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
  }

  /**
   * Create new subscription plan
   */
  async createSubscriptionPlan(req: Request, res: Response) {
    try {
      const {
        name,
        displayName,
        tier,
        description,
        price,
        currency,
        billingInterval,
        maxApiCalls,
        maxStorageMb,
        maxProcessingMin,
        maxFileSize,
        maxTranscriptionsMonthly,
        maxFilesDaily,
        maxFilesMonthly,
        maxAudioDurationMinutes,
        maxConcurrentJobs,
        maxVoiceSynthesisMonthly,
        maxExportOperationsMonthly,
        maxWorkspaces,
        maxUsers,
        priorityLevel,
        features,
        collaborationFeatures,
        isActive,
        isPublic,
        planCategory
      } = req.body;
      
      // Transform frontend data to match database schema
      const planData = {
        name: name || '',
        displayName: displayName || name || '',
        description: description || '',
        tier: tier || 'personal',
        price: price || 0,
        currency: currency || 'AUD',
        billingPeriod: billingInterval === 'monthly' ? 'monthly' : 'yearly',
        features: {
          maxApiCalls,
          maxStorageMb,
          maxProcessingMin,
          maxFileSize,
          maxWorkspaces,
          maxUsers,
          priorityLevel,
          basicFeatures: features || [],
          collaborationFeatures: collaborationFeatures || [],
          planCategory
        },
        quotas: {
          maxTranscriptionsMonthly,
          maxFilesDaily,
          maxFilesMonthly,
          maxAudioDurationMinutes,
          maxConcurrentJobs,
          maxVoiceSynthesisMonthly,
          maxExportOperationsMonthly
        },
        isActive: isActive !== undefined ? isActive : true,
        isPublic: isPublic !== undefined ? isPublic : true,
        sortOrder: priorityLevel || 0
      };
      
      const plan = await prisma.subscriptionPlan.create({
        data: planData
      });

      logger.info('Admin created new subscription plan:', { planId: plan.id, name: plan.name });
      res.status(201).json({ plan });
    } catch (error) {
      logger.error('Failed to create subscription plan:', error);
      res.status(500).json({ error: 'Failed to create subscription plan' });
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscriptionPlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const {
        name,
        displayName,
        tier,
        description,
        price,
        currency,
        billingInterval,
        maxApiCalls,
        maxStorageMb,
        maxProcessingMin,
        maxFileSize,
        maxTranscriptionsMonthly,
        maxFilesDaily,
        maxFilesMonthly,
        maxAudioDurationMinutes,
        maxConcurrentJobs,
        maxVoiceSynthesisMonthly,
        maxExportOperationsMonthly,
        maxWorkspaces,
        maxUsers,
        priorityLevel,
        features,
        collaborationFeatures,
        isActive,
        isPublic,
        planCategory
      } = req.body;

      // Transform frontend data to match database schema
      const updateData: any = {};
      
      if (name !== undefined) updateData.name = name;
      if (displayName !== undefined) updateData.displayName = displayName;
      if (tier !== undefined) updateData.tier = tier;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (currency !== undefined) updateData.currency = currency;
      if (billingInterval !== undefined) updateData.billingPeriod = billingInterval === 'monthly' ? 'monthly' : 'yearly';
      if (isActive !== undefined) updateData.isActive = isActive;
      if (isPublic !== undefined) updateData.isPublic = isPublic;
      if (priorityLevel !== undefined) updateData.sortOrder = priorityLevel;
      
      // Update features object
      if (maxApiCalls !== undefined || maxStorageMb !== undefined || maxProcessingMin !== undefined || 
          maxFileSize !== undefined || maxWorkspaces !== undefined || maxUsers !== undefined || 
          priorityLevel !== undefined || features !== undefined || collaborationFeatures !== undefined || 
          planCategory !== undefined) {
        updateData.features = {
          maxApiCalls,
          maxStorageMb,
          maxProcessingMin,
          maxFileSize,
          maxWorkspaces,
          maxUsers,
          priorityLevel,
          basicFeatures: features || [],
          collaborationFeatures: collaborationFeatures || [],
          planCategory
        };
      }
      
      // Update quotas object
      if (maxTranscriptionsMonthly !== undefined || maxFilesDaily !== undefined || 
          maxFilesMonthly !== undefined || maxAudioDurationMinutes !== undefined || 
          maxConcurrentJobs !== undefined || maxVoiceSynthesisMonthly !== undefined || 
          maxExportOperationsMonthly !== undefined) {
        updateData.quotas = {
          maxTranscriptionsMonthly,
          maxFilesDaily,
          maxFilesMonthly,
          maxAudioDurationMinutes,
          maxConcurrentJobs,
          maxVoiceSynthesisMonthly,
          maxExportOperationsMonthly
        };
      }

      const plan = await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: updateData
      });

      logger.info('Admin updated subscription plan:', { planId, name: plan.name });
      res.json({ plan });
    } catch (error) {
      logger.error('Failed to update subscription plan:', error);
      res.status(500).json({ error: 'Failed to update subscription plan' });
    }
  }

  /**
   * Delete subscription plan
   */
  async deleteSubscriptionPlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;

      // Check if plan has active subscriptions
      const activeSubscriptions = await prisma.workspaceSubscription.count({
        where: { planId: planId }
      });

      if (activeSubscriptions > 0) {
        return res.status(400).json({ 
          error: `Cannot delete plan with ${activeSubscriptions} active subscriptions` 
        });
      }

      await prisma.subscriptionPlan.delete({
        where: { id: planId }
      });

      logger.info('Admin deleted subscription plan:', { planId });
      return res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete subscription plan:', error);
      return res.status(500).json({ error: 'Failed to delete subscription plan' });
    }
  }

  /**
   * Get all workspace subscriptions for admin monitoring
   */
  async getAllSubscriptions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status, planId } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;
      if (planId) where.planId = planId;

      const [subscriptions, total] = await Promise.all([
        prisma.workspaceSubscription.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            workspace: {
              select: { id: true, name: true }
            },
            plan: {
              select: { id: true, name: true, tier: true }
            },
            _count: {
              select: { billingRecords: true }
            }
          }
        }),
        prisma.workspaceSubscription.count({ where })
      ]);

      res.json({
        subscriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch all subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
  }

  /**
   * Get billing analytics for admin dashboard
   */
  async getBillingAnalytics(_req: Request, res: Response) {
    try {
      const [
        totalRevenue,
        monthlyRevenue,
        subscriptionStats,
        planDistribution,
        recentTransactions
      ] = await Promise.all([
        // Total revenue
        prisma.billingRecord.aggregate({
          _sum: { amount: true },
          where: { status: 'completed' }
        }),
        // Monthly revenue (last 30 days)
        prisma.billingRecord.aggregate({
          _sum: { amount: true },
          where: {
            status: 'completed',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        // Subscription status stats
        prisma.workspaceSubscription.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        // Plan distribution
        prisma.workspaceSubscription.groupBy({
          by: ['planId'],
          _count: { planId: true }
        }),
        // Recent transactions
        prisma.billingRecord.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            subscription: {
              select: {
                workspace: {
                  select: { name: true }
                }
              }
            }
          }
        })
      ]);

      res.json({
        analytics: {
          totalRevenue: totalRevenue._sum.amount || 0,
          monthlyRevenue: monthlyRevenue._sum.amount || 0,
          subscriptionStats,
          planDistribution,
          recentTransactions
        }
      });
    } catch (error) {
      logger.error('Failed to fetch billing analytics:', error);
      res.status(500).json({ error: 'Failed to fetch billing analytics' });
    }
  }

  /**
   * Get usage analytics across all workspaces
   */
  async getUsageAnalytics(_req: Request, res: Response) {
    try {
      const [
        totalUsage,
        usageByPlan,
        topWorkspaces,
        usageTrends
      ] = await Promise.all([
        // Total usage across all metrics
        prisma.usageRecord.groupBy({
          by: ['recordType'],
          _sum: { quantity: true },
          _count: { id: true }
        }),
        // Usage by subscription plan
        prisma.usageRecord.findMany({
          include: {
            subscription: {
              include: {
                workspace: true,
                plan: {
                  select: { name: true, tier: true }
                }
              }
            }
          },
          take: 1000 // Limit for aggregation
        }),
        // Top workspaces by usage
        prisma.workspaceSubscription.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        }),
        // Usage trends (last 7 days)
        prisma.usageRecord.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      res.json({
        analytics: {
          totalUsage,
          usageByPlan,
          topWorkspaces,
          usageTrends
        }
      });
    } catch (error) {
      logger.error('Failed to fetch usage analytics:', error);
      res.status(500).json({ error: 'Failed to fetch usage analytics' });
    }
  }
}