import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  invoiceUrl?: string;
  createdAt: Date;
}

export interface UsageData {
  workspaceId: string;
  quotas: Record<string, number>;
  usage: Record<string, { quantity: number; cost?: number }>;
  totalCost: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface RecordUsageParams {
  workspaceId: string;
  operation: string;
  quantity: number;
  cost?: number;
  metadata?: any;
}

/**
 * Service for managing billing, usage tracking, and financial operations
 */
export class BillingService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get billing history for a workspace
   */
  async getBillingHistory(workspaceId: string, limit: number = 10): Promise<BillingRecord[]> {
    try {
      logger.info('Getting billing history', { workspaceId, limit });

      const records = await this.prisma.billingRecord.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return records.map(record => ({
        id: record.id,
        amount: Number(record.amount),
        currency: record.currency,
        status: record.status,
        description: record.description || undefined,
        invoiceUrl: record.invoiceUrl || undefined,
        createdAt: record.createdAt
      }));
    } catch (error) {
      logger.error('Error getting billing history:', error);
      throw new Error(`Failed to get billing history: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get current usage for a workspace
   */
  async getCurrentUsage(workspaceId: string): Promise<UsageData> {
    try {
      logger.info('Getting current usage', { workspaceId });

      // Get workspace subscription to determine quotas
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { 
          workspaceId,
          status: { in: ['active', 'trialing'] }
        },
        include: {
          plan: true
        }
      });

      if (!subscription) {
        throw new Error('No active subscription found');
      }

      // Calculate current billing period
      const now = new Date();
      const periodStart = new Date(subscription.currentPeriodStart);
      const periodEnd = new Date(subscription.currentPeriodEnd);

      // Get usage records for current period
      const usageRecords = await this.prisma.usageRecord.findMany({
        where: {
          workspaceId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      });

      // Aggregate usage by operation type
      const usageByType = usageRecords.reduce((acc, record) => {
        const operation = record.operation;
        if (!acc[operation]) {
          acc[operation] = { quantity: 0, cost: 0 };
        }
        acc[operation].quantity += Number(record.quantity);
        acc[operation].cost += Number(record.cost || 0);
        return acc;
      }, {} as Record<string, { quantity: number; cost: number }>);

      // Build quotas from plan
      const quotas = {
        storage_gb: Number(subscription.plan.maxStorageMb) / 1024,
        processing_minutes: Number(subscription.plan.maxProcessingMin),
        transcription_minutes: Number(subscription.plan.maxTranscriptionsMonthly),
        api_calls_per_month: Number(subscription.plan.maxApiCalls),
        ai_tokens_per_month: Number(subscription.plan.maxTokens)
      };

      // Calculate total cost
      const totalCost = Object.values(usageByType).reduce((sum, usage) => sum + usage.cost, 0);

      return {
        workspaceId,
        quotas,
        usage: usageByType,
        totalCost,
        period: {
          start: periodStart,
          end: periodEnd
        }
      };
    } catch (error) {
      logger.error('Error getting current usage:', error);
      throw new Error(`Failed to get usage data: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Record usage for a workspace
   */
  async recordUsage(params: RecordUsageParams): Promise<void> {
    try {
      logger.info('Recording usage', params);

      await this.prisma.usageRecord.create({
        data: {
          workspaceId: params.workspaceId,
          operation: params.operation,
          quantity: params.quantity,
          cost: params.cost || 0,
          metadata: params.metadata || {},
          createdAt: new Date()
        }
      });

      logger.info('Usage recorded successfully', { 
        workspaceId: params.workspaceId, 
        operation: params.operation 
      });
    } catch (error) {
      logger.error('Error recording usage:', error);
      throw new Error(`Failed to record usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get workspace limits based on subscription
   */
  async getWorkspaceLimits(workspaceId: string): Promise<Record<string, number>> {
    try {
      const subscription = await this.prisma.workspaceSubscription.findFirst({
        where: { 
          workspaceId,
          status: { in: ['active', 'trialing'] }
        },
        include: {
          plan: true
        }
      });

      if (!subscription) {
        // Return default free tier limits
        return {
          maxApiCalls: 100,
          maxTokens: 10000,
          maxStorageMb: 100,
          maxProcessingMin: 60,
          maxTranscriptionsMonthly: 5,
          maxFilesDaily: 3,
          maxFilesMonthly: 50,
          maxConcurrentJobs: 1,
          maxVoiceSynthesisMonthly: 0,
          maxExportOperationsMonthly: 5,
          maxAudioDurationMinutes: 30,
          priorityLevel: 3
        };
      }

      // Build quotas dynamically from plan data
      return {
        maxApiCalls: Number(subscription.plan.maxApiCalls),
        maxTokens: Number(subscription.plan.maxTokens),
        maxStorageMb: Number(subscription.plan.maxStorageMb),
        maxProcessingMin: Number(subscription.plan.maxProcessingMin),
        maxTranscriptionsMonthly: Number(subscription.plan.maxTranscriptionsMonthly),
        maxFilesDaily: Number(subscription.plan.maxFilesDaily),
        maxFilesMonthly: Number(subscription.plan.maxFilesMonthly),
        maxConcurrentJobs: Number(subscription.plan.maxConcurrentJobs),
        maxVoiceSynthesisMonthly: Number(subscription.plan.maxVoiceSynthesisMonthly),
        maxExportOperationsMonthly: Number(subscription.plan.maxExportOperationsMonthly),
        maxAudioDurationMinutes: Number(subscription.plan.maxAudioDurationMinutes),
        priorityLevel: Number(subscription.plan.priorityLevel)
      };
    } catch (error) {
      logger.error('Error getting workspace limits:', error);
      throw new Error(`Failed to get workspace limits: ${getErrorMessage(error)}`);
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
      logger.error('Error checking active subscription:', error);
      return false;
    }
  }

  /**
   * Create billing record
   */
  async createBillingRecord(params: {
    workspaceId: string;
    amount: number;
    currency: string;
    status: string;
    description?: string;
    invoiceUrl?: string;
    gatewayTransactionId?: string;
    metadata?: any;
  }): Promise<BillingRecord> {
    try {
      const record = await this.prisma.billingRecord.create({
        data: {
          workspaceId: params.workspaceId,
          amount: params.amount,
          currency: params.currency,
          status: params.status,
          description: params.description,
          invoiceUrl: params.invoiceUrl,
          gatewayTransactionId: params.gatewayTransactionId,
          metadata: params.metadata || {},
          createdAt: new Date()
        }
      });

      return {
        id: record.id,
        amount: Number(record.amount),
        currency: record.currency,
        status: record.status,
        description: record.description || undefined,
        invoiceUrl: record.invoiceUrl || undefined,
        createdAt: record.createdAt
      };
    } catch (error) {
      logger.error('Error creating billing record:', error);
      throw new Error(`Failed to create billing record: ${getErrorMessage(error)}`);
    }
  }
}