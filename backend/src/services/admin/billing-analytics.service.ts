/**
 * Admin Billing Analytics Service
 * Handles billing and usage analytics for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminBillingAnalyticsService {
  /**
   * Get comprehensive billing analytics
   */
  async getBillingAnalytics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      monthlyRevenue,
      lastMonthRevenue,
      totalRevenue,
      revenueByPlan,
      paymentStats
    ] = await Promise.all([
      this.calculateMonthlyRevenue(startOfMonth, now),
      this.calculateMonthlyRevenue(startOfLastMonth, endOfLastMonth),
      this.calculateTotalRevenue(),
      this.getRevenueByPlan(),
      this.getPaymentStatistics()
    ]);

    const revenueGrowth = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    return {
      revenue: {
        thisMonth: monthlyRevenue,
        lastMonth: lastMonthRevenue,
        total: totalRevenue,
        growth: revenueGrowth
      },
      revenueByPlan,
      payments: paymentStats
    };
  }

  /**
   * Get usage analytics across the platform
   */
  async getUsageAnalytics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsage,
      usageByPlan,
      topWorkspaces,
      usageTrends
    ] = await Promise.all([
      this.getTotalUsageStats(thirtyDaysAgo),
      this.getUsageByPlan(thirtyDaysAgo),
      this.getTopWorkspacesByUsage(thirtyDaysAgo),
      this.getUsageTrends()
    ]);

    return {
      totalUsage,
      usageByPlan,
      topWorkspaces,
      trends: usageTrends
    };
  }

  /**
   * Calculate monthly revenue from active subscriptions
   */
  private async calculateMonthlyRevenue(startDate: Date, endDate: Date): Promise<number> {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        createdAt: { lte: endDate }
      },
      include: {
        plan: {
          select: { price: true, billingPeriod: true }
        }
      }
    });

    return subscriptions.reduce((total, sub) => {
      const planPrice = Number(sub.plan.price);
      const monthlyPrice = sub.plan.billingPeriod === 'yearly' 
        ? planPrice / 12 
        : planPrice;
      return total + monthlyPrice;
    }, 0);
  }

  /**
   * Calculate total revenue from all completed payments
   */
  private async calculateTotalRevenue(): Promise<number> {
    const result = await prisma.ewayTransaction.aggregate({
      _sum: { amount: true },
      where: {
        transactionStatus: 'completed'
      }
    });

    return result._sum.amount || 0;
  }

  /**
   * Get revenue breakdown by subscription plan
   */
  private async getRevenueByPlan() {
    const planRevenue = await prisma.subscription.findMany({
      where: { status: 'active' },
      include: {
        plan: {
          select: { 
            id: true,
            name: true, 
            displayName: true,
            price: true, 
            billingPeriod: true 
          }
        }
      }
    });

    const revenueMap = planRevenue.reduce((acc, sub) => {
      const planId = sub.plan.id;
      const planPrice = Number(sub.plan.price);
      const monthlyPrice = sub.plan.billingPeriod === 'yearly' 
        ? planPrice / 12 
        : planPrice;

      if (!acc[planId]) {
        acc[planId] = {
          planName: sub.plan.displayName || sub.plan.name,
          subscriptionCount: 0,
          monthlyRevenue: 0
        };
      }

      acc[planId].subscriptionCount += 1;
      acc[planId].monthlyRevenue += monthlyPrice;

      return acc;
    }, {} as any);

    return Object.entries(revenueMap).map(([planId, data]) => ({
      planId,
      ...(data as any)
    }));
  }

  /**
   * Get payment statistics
   */
  private async getPaymentStatistics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      refundedPayments
    ] = await Promise.all([
      prisma.ewayTransaction.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      prisma.ewayTransaction.count({
        where: { 
          transactionStatus: 'completed',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.ewayTransaction.count({
        where: { 
          transactionStatus: 'failed',
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.ewayTransaction.count({
        where: { 
          transactionStatus: 'refunded',
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ]);

    const successRate = totalPayments > 0 
      ? (successfulPayments / totalPayments) * 100 
      : 0;

    return {
      totalPayments,
      successfulPayments,
      failedPayments,
      refundedPayments,
      successRate: parseFloat(successRate.toFixed(2))
    };
  }

  /**
   * Get total usage statistics
   */
  private async getTotalUsageStats(since: Date) {
    const [
      totalJobs,
      totalProcessingMinutes,
      totalStorageUsed,
      totalApiCalls
    ] = await Promise.all([
      prisma.job.count({
        where: { createdAt: { gte: since } }
      }),
      prisma.job.aggregate({
        _sum: { processingDuration: true },
        where: { 
          status: 'completed',
          createdAt: { gte: since }
        }
      }),
      prisma.file.aggregate({
        _sum: { size: true },
        where: { createdAt: { gte: since } }
      }),
      prisma.apiKeyUsage.aggregate({
        _sum: { requestCount: true },
        where: { date: { gte: since } }
      })
    ]);

    return {
      totalJobs,
      totalProcessingMinutes: Math.round((totalProcessingMinutes._sum.processingDuration || 0) / 60),
      totalStorageUsed: Math.round((totalStorageUsed._sum.size || 0) / (1024 * 1024)), // MB
      totalApiCalls: totalApiCalls._sum.requestCount || 0
    };
  }

  /**
   * Get usage statistics by subscription plan
   */
  private async getUsageByPlan(since: Date) {
    const workspaceUsage = await prisma.workspace.findMany({
      include: {
        subscription: {
          include: {
            plan: {
              select: { id: true, name: true, displayName: true }
            }
          }
        },
        _count: {
          select: {
            jobs: {
              where: { createdAt: { gte: since } }
            },
            files: {
              where: { createdAt: { gte: since } }
            }
          }
        }
      }
    });

    const planUsageMap = workspaceUsage.reduce((acc, workspace) => {
      if (!workspace.subscription) return acc;

      const planId = workspace.subscription.plan.id;
      if (!acc[planId]) {
        acc[planId] = {
          planName: workspace.subscription.plan.displayName || workspace.subscription.plan.name,
          jobCount: 0,
          fileCount: 0,
          workspaceCount: 0
        };
      }

      acc[planId].jobCount += workspace._count.jobs;
      acc[planId].fileCount += workspace._count.files;
      acc[planId].workspaceCount += 1;

      return acc;
    }, {} as any);

    return Object.entries(planUsageMap).map(([planId, data]) => ({
      planId,
      ...(data as any)
    }));
  }

  /**
   * Get top workspaces by usage
   */
  private async getTopWorkspacesByUsage(since: Date, limit: number = 10) {
    const workspaces = await prisma.workspace.findMany({
      include: {
        subscription: {
          include: {
            plan: {
              select: { displayName: true, name: true }
            }
          }
        },
        _count: {
          select: {
            jobs: {
              where: { createdAt: { gte: since } }
            },
            files: {
              where: { createdAt: { gte: since } }
            }
          }
        }
      }
    });

    return workspaces
      .map(workspace => ({
        id: workspace.id,
        name: workspace.name,
        jobCount: workspace._count.jobs,
        fileCount: workspace._count.files,
        planName: workspace.subscription?.plan.displayName || workspace.subscription?.plan.name || 'Free',
        totalActivity: workspace._count.jobs + workspace._count.files
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, limit);
  }

  /**
   * Get usage trends over time
   */
  private async getUsageTrends() {
    const now = new Date();
    const trends = [];

    // Get last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [jobCount, fileCount] = await Promise.all([
        prisma.job.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        }),
        prisma.file.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        })
      ]);

      trends.push({
        month: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        jobCount,
        fileCount,
        totalActivity: jobCount + fileCount
      });
    }

    return trends;
  }
}