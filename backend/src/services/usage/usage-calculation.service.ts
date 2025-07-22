import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { CurrentUsage, UsageAggregation, UsageCosts } from './types';
import { QuotaManagementService } from './quota-management.service';

const prisma = new PrismaClient();

/**
 * Service for calculating workspace usage across different resource types
 */
export class UsageCalculationService {
  private quotaService = new QuotaManagementService();

  /**
   * Get current usage for a workspace within a date range
   */
  async getWorkspaceUsage(
    workspaceId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CurrentUsage> {
    try {
      const start = startDate || this.getMonthStart();
      const end = endDate || new Date();

      const aggregatedUsage = await this.aggregateUsageData(workspaceId, start, end);
      const quota = await this.quotaService.getWorkspaceQuota(workspaceId);

      return {
        storageBytes: aggregatedUsage.storageBytes,
        processingMinutes: aggregatedUsage.processingMinutes,
        apiCalls: aggregatedUsage.apiCalls,
        transcriptionMinutes: aggregatedUsage.transcriptionMinutes,
        aiTokens: aggregatedUsage.aiTokens,
        percentUsed: {
          storage: Number((aggregatedUsage.storageBytes * BigInt(100)) / quota.storageBytes),
          processing: (aggregatedUsage.processingMinutes / quota.processingMinutes) * 100,
          apiCalls: (aggregatedUsage.apiCalls / quota.apiCalls) * 100,
          transcription: (aggregatedUsage.transcriptionMinutes / quota.transcriptionMinutes) * 100,
          aiTokens: (aggregatedUsage.aiTokens / quota.aiTokens) * 100
        }
      };
    } catch (error) {
      logger.error('Failed to get workspace usage', { workspaceId, error });
      throw new Error(`Failed to get workspace usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Aggregate usage data from multiple database sources
   */
  private async aggregateUsageData(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageAggregation> {
    const [
      storageUsage,
      processingUsage,
      transcriptionData,
      apiUsage
    ] = await Promise.all([
      this.getStorageUsage(workspaceId),
      this.getProcessingUsage(workspaceId, startDate, endDate),
      this.getTranscriptionUsage(workspaceId, startDate, endDate),
      this.getApiUsage(workspaceId, startDate, endDate)
    ]);

    return {
      storageBytes: BigInt(Number(storageUsage._sum?.fileSize || 0)),
      processingMinutes: (processingUsage._count || 0) * 5, // Estimate 5 min per job
      apiCalls: apiUsage,
      transcriptionMinutes: Math.round(((transcriptionData._sum?.durationSeconds || 0)) / 60),
      aiTokens: 0 // Simplified - token usage model doesn't exist yet
    };
  }

  /**
   * Calculate storage usage from uploaded files
   */
  private async getStorageUsage(workspaceId: string) {
    return await prisma.audioUpload.aggregate({
      where: {
        workspaceId,
        uploadStatus: 'completed'
      },
      _sum: {
        fileSize: true
      }
    });
  }

  /**
   * Calculate processing usage from completed jobs
   */
  private async getProcessingUsage(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.processingJob.aggregate({
      where: {
        upload: { workspaceId },
        status: 'completed',
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _count: true
    });
  }

  /**
   * Calculate transcription usage from audio history
   */
  private async getTranscriptionUsage(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.audioHistory.aggregate({
      where: {
        workspaceId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      _sum: {
        durationSeconds: true
      }
    });
  }

  /**
   * Calculate API usage from API key management logs
   */
  private async getApiUsage(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return await prisma.apiKeyManagement.count({
      where: {
        user: {
          workspaces: {
            some: { workspaceId }
          }
        },
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });
  }

  /**
   * Calculate usage costs based on current pricing model
   */
  calculateUsageCosts(usage: CurrentUsage): UsageCosts {
    const costs = {
      storage: Number(usage.storageBytes) / (1024 * 1024 * 1024) * 0.02, // $0.02 per GB
      processing: usage.processingMinutes * 0.001, // $0.001 per minute
      apiCalls: usage.apiCalls * 0.00001, // $0.00001 per call
      total: 0
    };
    
    costs.total = costs.storage + costs.processing + costs.apiCalls;
    return costs;
  }

  /**
   * Track usage for a specific resource
   */
  async trackResourceUsage(
    workspaceId: string,
    resourceType: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.usageTracking.create({
        data: {
          userId: 'system', // TODO: Pass actual userId
          workspaceId,
          resourceType,
          resourceId: 'auto-generated',
          action: 'track',
          quantity: amount,
          metadata: metadata || {}
        }
      });

      logger.info('Usage tracked successfully', {
        workspaceId,
        resourceType,
        amount
      });
    } catch (error) {
      logger.error('Failed to track usage', { workspaceId, resourceType, amount, error });
      // Don't throw - usage tracking shouldn't break the main flow
    }
  }

  /**
   * Get usage statistics for analytics
   */
  async getUsageStatistics(workspaceId: string, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const dailyUsage = await prisma.usageTracking.groupBy({
        by: ['resourceType'],
        where: {
          workspaceId,
          timestamp: {
            gte: startDate
          }
        },
        _sum: {
          quantity: true
        }
      });

      return dailyUsage.map(item => ({
        resourceType: item.resourceType,
        totalAmount: Number(item._sum?.quantity || 0)
      }));
    } catch (error) {
      logger.error('Failed to get usage statistics', { workspaceId, error });
      throw new Error(`Failed to get usage statistics: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get the start of the current month
   */
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}