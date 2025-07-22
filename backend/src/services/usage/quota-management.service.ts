import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { 
  UsageQuota, 
  QuotaCheckResult, 
  QuotaEnforcementResult, 
  ResourceType 
} from './types';

const prisma = new PrismaClient();

/**
 * Service for managing workspace quotas and limits
 */
export class QuotaManagementService {
  
  /**
   * Get usage quota for a workspace based on subscription plan
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
        return this.getDefaultQuota();
      }

      const subscription = workspace.subscriptions[0];
      const plan = subscription.plan;
      const quotas = plan.quotas as any;

      return {
        storageBytes: BigInt((quotas.storage_gb || 1) * 1024 * 1024 * 1024),
        processingMinutes: (quotas.processing_minutes || 60),
        apiCalls: quotas.api_calls_per_month || 10000,
        transcriptionMinutes: (quotas.transcription_minutes || 30),
        aiTokens: quotas.ai_tokens_per_month || 1000000
      };
    } catch (error) {
      logger.error('Failed to get workspace quota', { workspaceId, error });
      throw new Error(`Failed to get workspace quota: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if workspace has exceeded quota for a specific resource type
   */
  async checkQuotaExceeded(
    workspaceId: string,
    resourceType: ResourceType,
    currentUsage: any,
    additionalUsage: number = 0
  ): Promise<QuotaCheckResult> {
    try {
      const quota = await this.getWorkspaceQuota(workspaceId);

      let current: number;
      let limit: number;

      switch (resourceType) {
        case 'storage':
          current = Number(currentUsage.storageBytes + BigInt(additionalUsage));
          limit = Number(quota.storageBytes);
          break;
        case 'processing':
          current = currentUsage.processingMinutes + additionalUsage;
          limit = quota.processingMinutes;
          break;
        case 'apiCalls':
          current = currentUsage.apiCalls + additionalUsage;
          limit = quota.apiCalls;
          break;
        case 'transcription':
          current = currentUsage.transcriptionMinutes + additionalUsage;
          limit = quota.transcriptionMinutes;
          break;
        case 'aiTokens':
          current = currentUsage.aiTokens + additionalUsage;
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
   * Enforce quota limits and provide user feedback
   */
  async enforceQuota(
    workspaceId: string,
    resourceType: ResourceType,
    currentUsage: any,
    requestedAmount: number
  ): Promise<QuotaEnforcementResult> {
    try {
      const quotaCheck = await this.checkQuotaExceeded(
        workspaceId, 
        resourceType, 
        currentUsage, 
        requestedAmount
      );

      if (quotaCheck.exceeded) {
        const suggestion = this.getQuotaSuggestion(resourceType);
        
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

  /**
   * Check for quota warnings (80-100% usage)
   */
  async checkQuotaWarnings(workspaceId: string, currentUsage: any): Promise<void> {
    try {
      const quotaTypes: ResourceType[] = ['storage', 'processing', 'apiCalls', 'transcription', 'aiTokens'];
      
      for (const type of quotaTypes) {
        const quotaCheck = await this.checkQuotaExceeded(workspaceId, type, currentUsage);
        
        if (quotaCheck.percentUsed >= 80 && quotaCheck.percentUsed < 100) {
          logger.warn('Approaching quota limit', {
            workspaceId,
            resourceType: type,
            percentUsed: quotaCheck.percentUsed
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check quota warnings', { workspaceId, error });
      // Don't throw - warnings shouldn't break the main flow
    }
  }

  /**
   * Get default free tier quotas
   */
  private getDefaultQuota(): UsageQuota {
    return {
      storageBytes: BigInt(1 * 1024 * 1024 * 1024), // 1GB
      processingMinutes: 60,
      apiCalls: 1000,
      transcriptionMinutes: 30,
      aiTokens: 50000
    };
  }

  /**
   * Get appropriate suggestion for quota exceeded scenario
   */
  private getQuotaSuggestion(resourceType: ResourceType): string {
    switch (resourceType) {
      case 'storage':
        return 'Delete old files or upgrade your plan for more storage.';
      case 'transcription':
        return 'Wait until next month or upgrade for more transcription minutes.';
      case 'aiTokens':
        return 'Optimize your AI usage or upgrade for more tokens.';
      default:
        return 'Please upgrade your plan for more resources.';
    }
  }
}