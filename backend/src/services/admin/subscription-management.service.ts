/**
 * Admin Subscription Management Service
 * Handles subscription management operations for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminSubscriptionManagementService {
  /**
   * Get all subscriptions with filtering and pagination
   */
  async getAllSubscriptions(queryParams: any) {
    const {
      page = 1,
      limit = 20,
      status,
      planId,
      workspaceId,
      search
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (planId) {
      where.planId = planId;
    }

    if (workspaceId) {
      where.workspaceId = workspaceId;
    }

    if (search) {
      where.OR = [
        { workspace: { name: { contains: search, mode: 'insensitive' } } },
        { plan: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: {
            select: {
              id: true,
              name: true,
              users: {
                select: {
                  user: {
                    select: { email: true }
                  },
                  role: true
                },
                where: { role: 'owner' },
                take: 1
              }
            }
          },
          plan: {
            select: {
              id: true,
              name: true,
              displayName: true,
              tier: true,
              price: true,
              currency: true
            }
          }
        }
      }),
      prisma.subscription.count({ where })
    ]);

    return {
      subscriptions: subscriptions.map(subscription => ({
        id: subscription.id,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
        workspace: {
          id: subscription.workspace.id,
          name: subscription.workspace.name,
          ownerEmail: subscription.workspace.users[0]?.user.email || 'Unknown'
        },
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          displayName: subscription.plan.displayName,
          tier: subscription.plan.tier,
          monthlyPrice: Number(subscription.plan.price),
          currency: subscription.plan.currency
        }
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get subscription overview statistics
   */
  async getSubscriptionOverview() {
    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      revenueStats,
      planDistribution
    ] = await Promise.all([
      prisma.subscription.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.subscription.count({ where: { status: 'trialing' } }),
      prisma.subscription.count({ where: { status: 'cancelled' } }),
      prisma.subscription.aggregate({
        _sum: { 
          // Note: This would need to be calculated based on plan prices
          // For now, we'll calculate it differently
        },
        where: { status: 'active' }
      }),
      prisma.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
        include: {
          plan: {
            select: { name: true, displayName: true }
          }
        }
      })
    ]);

    // Calculate monthly recurring revenue
    const activeSubs = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: {
        plan: {
          select: { price: true, billingPeriod: true }
        }
      }
    });

    const monthlyRevenue = activeSubs.reduce((total, sub) => {
      const planPrice = Number(sub.plan.price);
      const monthlyPrice = sub.plan.billingPeriod === 'yearly' 
        ? planPrice / 12 
        : planPrice;
      return total + monthlyPrice;
    }, 0);

    return {
      overview: {
        totalSubscriptions,
        activeSubscriptions,
        trialSubscriptions,
        cancelledSubscriptions,
        monthlyRecurringRevenue: monthlyRevenue,
        averageRevenuePerUser: activeSubscriptions > 0 
          ? monthlyRevenue / activeSubscriptions 
          : 0
      },
      planDistribution: planDistribution.map(item => ({
        planId: item.planId,
        subscriptionCount: item._count.id
      }))
    };
  }

  /**
   * Get subscription growth metrics
   */
  async getSubscriptionGrowth() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      newSubscriptionsLast30Days,
      newSubscriptionsLast60Days,
      cancelledLast30Days,
      cancelledLast60Days
    ] = await Promise.all([
      prisma.subscription.count({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.subscription.count({
        where: {
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'cancelled',
          updatedAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.subscription.count({
        where: {
          status: 'cancelled',
          updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
        }
      })
    ]);

    const newSubsGrowth = newSubscriptionsLast60Days > 0 
      ? ((newSubscriptionsLast30Days - newSubscriptionsLast60Days) / newSubscriptionsLast60Days) * 100
      : 0;

    const churnRate = newSubscriptionsLast30Days > 0
      ? (cancelledLast30Days / newSubscriptionsLast30Days) * 100
      : 0;

    return {
      growth: {
        newSubscriptionsLast30Days,
        newSubscriptionsLast60Days,
        growthRate: newSubsGrowth,
        churnRate,
        netGrowth: newSubscriptionsLast30Days - cancelledLast30Days
      }
    };
  }
}