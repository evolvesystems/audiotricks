import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';

const prisma = new PrismaClient();

export interface UsageQuota {
  storageBytes: bigint;
  processingMinutes: number;
  apiCalls: number;
  transcriptionMinutes: number;
  aiTokens: number;
}

export interface CurrentUsage {
  storageBytes: bigint;
  processingMinutes: number;
  apiCalls: number;
  transcriptionMinutes: number;
  aiTokens: number;
  percentUsed: {
    storage: number;
    processing: number;
    apiCalls: number;
    transcription: number;
    aiTokens: number;
  };
}

export interface UsageReport {
  period: string;
  startDate: Date;
  endDate: Date;
  usage: CurrentUsage;
  quota: UsageQuota;
  costs: {
    storage: number;
    processing: number;
    apiCalls: number;
    total: number;
  };
}

export class UsageTrackingService {
  
  /**
   * Get usage quota for a workspace
   */
  async getWorkspaceQuota(workspaceId: string): Promise<UsageQuota> {
    try {
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          subscriptions: {
            where: {
              status: 'active'
            },
            include: {
              plan: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        }
      });

      if (!workspace || workspace.subscriptions.length === 0) {
        // Default free tier quotas
        return {
          storageBytes: BigInt(1 * 1024 * 1024 * 1024), // 1GB
          processingMinutes: 60,
          apiCalls: 1000,
          transcriptionMinutes: 30,
          aiTokens: 50000
        };
      }

      const subscription = workspace.subscriptions[0];
      const plan = subscription.plan;
      const features = plan.features as any;

      return {
        storageBytes: BigInt(features.storageGB * 1024 * 1024 * 1024),
        processingMinutes: features.processingHours * 60,
        apiCalls: features.apiCallsPerMonth || 10000,
        transcriptionMinutes: features.transcriptionHours * 60,
        aiTokens: features.aiTokensPerMonth || 1000000
      };
    } catch (error) {
      logger.error('Failed to get workspace quota', { workspaceId, error });
      throw new Error(`Failed to get workspace quota: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get current usage for a workspace
   */
  async getWorkspaceUsage(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CurrentUsage> {
    try {
      const start = startDate || this.getMonthStart();
      const end = endDate || new Date();

      // Get storage usage
      const storageUsage = await prisma.audioUpload.aggregate({
        where: {
          workspaceId,
          status: 'completed'
        },
        _sum: {
          fileSize: true
        }
      });

      // Get processing usage
      const processingUsage = await prisma.processingJob.aggregate({
        where: {
          upload: { workspaceId },
          status: 'completed',
          queuedAt: {
            gte: start,
            lte: end
          }
        },
        _count: true
      });

      // Get transcription minutes
      const transcriptionMinutes = await prisma.audioHistory.aggregate({
        where: {
          workspaceId,
          queuedAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          durationSeconds: true
        }
      });

      // Get API usage (using ApiKeyManagement as proxy)
      const apiUsage = await prisma.apiKeyManagement.count({
        where: {
          user: {
            workspaces: {
              some: { workspaceId }
            }
          },
          createdAt: {
            gte: start,
            lte: end
          }
        }
      });

      // Get AI token usage
      const tokenUsage = { _sum: { tokensUsed: 0, cost: 0 } }; // Simplified - model doesn't exist
      /*await prisma.apiKeyUsageLog.aggregate({
        where: {
          apiKey: {
            user: {
              workspaces: {
                some: { workspaceId }
              }
            }
          },
          queuedAt: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          tokensUsed: true
        }
      });*/

      const quota = await this.getWorkspaceQuota(workspaceId);
      const storageBytes = BigInt(storageUsage._sum?.fileSize || 0);
      const processingMinutesUsed = (processingUsage._count || 0) * 5; // Estimate 5 min per job
      const transcriptionMinutesUsed = Math.round((transcriptionMinutes._sum.durationSeconds || 0) / 60);
      const aiTokensUsed = tokenUsage._sum.tokensUsed || 0;

      return {
        storageBytes,
        processingMinutes: processingMinutesUsed,
        apiCalls: apiUsage,
        transcriptionMinutes: transcriptionMinutesUsed,
        aiTokens: aiTokensUsed,
        percentUsed: {
          storage: Number((storageBytes * BigInt(100)) / quota.storageBytes),
          processing: (processingMinutesUsed / quota.processingMinutes) * 100,
          apiCalls: (apiUsage / quota.apiCalls) * 100,
          transcription: (transcriptionMinutesUsed / quota.transcriptionMinutes) * 100,
          aiTokens: (aiTokensUsed / quota.aiTokens) * 100
        }
      };
    } catch (error) {
      logger.error('Failed to get workspace usage', { workspaceId, error });
      throw new Error(`Failed to get workspace usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if workspace has exceeded quota
   */
  async checkQuotaExceeded(
    workspaceId: string,
    resourceType: 'storage' | 'processing' | 'apiCalls' | 'transcription' | 'aiTokens',
    additionalUsage: number = 0
  ): Promise<{ exceeded: boolean; current: number; limit: number; percentUsed: number }> {
    try {
      const quota = await this.getWorkspaceQuota(workspaceId);
      const usage = await this.getWorkspaceUsage(workspaceId);

      let current: number;
      let limit: number;

      switch (resourceType) {
        case 'storage':
          current = Number(usage.storageBytes + BigInt(additionalUsage));
          limit = Number(quota.storageBytes);
          break;
        case 'processing':
          current = usage.processingMinutes + additionalUsage;
          limit = quota.processingMinutes;
          break;
        case 'apiCalls':
          current = usage.apiCalls + additionalUsage;
          limit = quota.apiCalls;
          break;
        case 'transcription':
          current = usage.transcriptionMinutes + additionalUsage;
          limit = quota.transcriptionMinutes;
          break;
        case 'aiTokens':
          current = usage.aiTokens + additionalUsage;
          limit = quota.aiTokens;
          break;
      }

      const percentUsed = (current / limit) * 100;
      const exceeded = current > limit;

      if (exceeded) {
        logger.warn('Quota exceeded', {
          workspaceId,
          resourceType,
          current,
          limit,
          percentUsed
        });
      }

      return {
        exceeded,
        current,
        limit,
        percentUsed
      };
    } catch (error) {
      logger.error('Failed to check quota', { workspaceId, resourceType, error });
      throw new Error(`Failed to check quota: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Track usage for a resource
   */
  async trackUsage(
    workspaceId: string,
    resourceType: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.usageTracking.create({
        data: {
          workspaceId,
          resourceType,
          amount: BigInt(amount),
          metadata: metadata || {}
        }
      });

      // Check if approaching quota limits
      const quotaTypes = ['storage', 'processing', 'apiCalls', 'transcription', 'aiTokens'];
      for (const type of quotaTypes) {
        const quotaCheck = await this.checkQuotaExceeded(workspaceId, type as any);
        
        if (quotaCheck.percentUsed >= 80 && quotaCheck.percentUsed < 100) {
          // Send warning notification (to be implemented)
          logger.warn('Approaching quota limit', {
            workspaceId,
            resourceType: type,
            percentUsed: quotaCheck.percentUsed
          });
        }
      }
    } catch (error) {
      logger.error('Failed to track usage', { workspaceId, resourceType, amount, error });
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(
    workspaceId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ): Promise<UsageReport> {
    try {
      let startDate: Date;
      let endDate = new Date();

      switch (period) {
        case 'daily':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
          startDate = this.getMonthStart();
          break;
      }

      const usage = await this.getWorkspaceUsage(workspaceId, startDate, endDate);
      const quota = await this.getWorkspaceQuota(workspaceId);

      // Calculate costs (simplified)
      const costs = {
        storage: Number(usage.storageBytes) / (1024 * 1024 * 1024) * 0.02, // $0.02 per GB
        processing: usage.processingMinutes * 0.001, // $0.001 per minute
        apiCalls: usage.apiCalls * 0.00001, // $0.00001 per call
        total: 0
      };
      costs.total = costs.storage + costs.processing + costs.apiCalls;

      return {
        period,
        startDate,
        endDate,
        usage,
        quota,
        costs
      };
    } catch (error) {
      logger.error('Failed to generate usage report', { workspaceId, period, error });
      throw new Error(`Failed to generate usage report: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Reset monthly usage counters
   */
  async resetMonthlyUsage(): Promise<void> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: { isActive: true }
      });

      for (const workspace of workspaces) {
        // Archive current month's usage
        const report = await this.generateUsageReport(workspace.id, 'monthly');
        
        await prisma.usageReport.create({
          data: {
            workspaceId: workspace.id,
            period: 'monthly',
            startDate: report.startDate,
            endDate: report.endDate,
            storageBytes: report.usage.storageBytes,
            processingMinutes: report.usage.processingMinutes,
            apiCalls: report.usage.apiCalls,
            transcriptionMinutes: report.usage.transcriptionMinutes,
            aiTokens: report.usage.aiTokens,
            totalCost: report.costs.total,
            metadata: {
              costs: report.costs,
              percentUsed: report.usage.percentUsed
            }
          }
        });

        logger.info('Monthly usage archived', {
          workspaceId: workspace.id,
          period: report.period,
          totalCost: report.costs.total
        });
      }
    } catch (error) {
      logger.error('Failed to reset monthly usage', { error });
      throw new Error(`Failed to reset monthly usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get the start of the current month
   */
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  /**
   * Enforce quota limits
   */
  async enforceQuota(
    workspaceId: string,
    resourceType: 'storage' | 'processing' | 'apiCalls' | 'transcription' | 'aiTokens',
    requestedAmount: number
  ): Promise<{ allowed: boolean; reason?: string; suggestion?: string }> {
    try {
      const quotaCheck = await this.checkQuotaExceeded(workspaceId, resourceType, requestedAmount);

      if (quotaCheck.exceeded) {
        let suggestion = 'Please upgrade your plan for more resources.';
        
        switch (resourceType) {
          case 'storage':
            suggestion = 'Delete old files or upgrade your plan for more storage.';
            break;
          case 'transcription':
            suggestion = 'Wait until next month or upgrade for more transcription minutes.';
            break;
          case 'aiTokens':
            suggestion = 'Optimize your AI usage or upgrade for more tokens.';
            break;
        }

        return {
          allowed: false,
          reason: `${resourceType} quota exceeded. Used ${quotaCheck.current} of ${quotaCheck.limit}.`,
          suggestion
        };
      }

      // Check if approaching limit (>90%)
      if (quotaCheck.percentUsed > 90) {
        logger.warn('Approaching quota limit', {
          workspaceId,
          resourceType,
          percentUsed: quotaCheck.percentUsed
        });
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Failed to enforce quota', { workspaceId, resourceType, error });
      // Allow operation on error to avoid blocking users
      return { allowed: true };
    }
  }
}