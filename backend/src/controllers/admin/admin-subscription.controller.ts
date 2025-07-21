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
        plans: plans.map(plan => ({
          ...plan,
          activeSubscriptions: plan._count.subscriptions
        }))
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
      const planData = req.body;
      
      const plan = await prisma.subscriptionPlan.create({
        data: {
          ...planData,
          createdAt: new Date(),
          updatedAt: new Date()
        }
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
      const updateData = req.body;

      const plan = await prisma.subscriptionPlan.update({
        where: { id: planId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
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
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete subscription plan:', error);
      res.status(500).json({ error: 'Failed to delete subscription plan' });
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
              select: { id: true, name: true, ownerId: true }
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
  async getBillingAnalytics(req: Request, res: Response) {
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
            workspace: {
              select: { name: true }
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
  async getUsageAnalytics(req: Request, res: Response) {
    try {
      const [
        totalUsage,
        usageByPlan,
        topWorkspaces,
        usageTrends
      ] = await Promise.all([
        // Total usage across all metrics
        prisma.usageRecord.groupBy({
          by: ['metricType'],
          _sum: { value: true },
          _count: { id: true }
        }),
        // Usage by subscription plan
        prisma.usageRecord.findMany({
          include: {
            workspace: {
              include: {
                subscriptions: {
                  where: { status: 'active' },
                  include: {
                    subscriptionPlan: {
                      select: { name: true, tier: true }
                    }
                  }
                }
              }
            }
          },
          take: 1000 // Limit for aggregation
        }),
        // Top workspaces by usage
        prisma.usageCounter.findMany({
          take: 10,
          orderBy: { audioProcessingCount: 'desc' },
          include: {
            workspace: {
              select: { id: true, name: true }
            }
          }
        }),
        // Usage trends (last 7 days)
        prisma.usageRecord.findMany({
          where: {
            timestamp: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          },
          orderBy: { timestamp: 'asc' }
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