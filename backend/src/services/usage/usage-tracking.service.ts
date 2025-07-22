import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { 
  UsageQuota, 
  CurrentUsage, 
  UsageReport, 
  ResourceType, 
  ReportPeriod,
  QuotaCheckResult,
  QuotaEnforcementResult
} from './types';
import { QuotaManagementService } from './quota-management.service';
import { UsageCalculationService } from './usage-calculation.service';
import { UsageReportingService } from './usage-reporting.service';

/**
 * Main service class for usage tracking functionality
 * Orchestrates quota management, usage calculation, and reporting services
 */
export class UsageTrackingService {
  private quotaService = new QuotaManagementService();
  private calculationService = new UsageCalculationService();
  private reportingService = new UsageReportingService();

  /**
   * Get usage quota for a workspace
   */
  async getWorkspaceQuota(workspaceId: string): Promise<UsageQuota> {
    try {
      return await this.quotaService.getWorkspaceQuota(workspaceId);
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
      return await this.calculationService.getWorkspaceUsage(workspaceId, startDate, endDate);
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
    resourceType: ResourceType,
    additionalUsage: number = 0
  ): Promise<QuotaCheckResult> {
    try {
      const currentUsage = await this.calculationService.getWorkspaceUsage(workspaceId);
      return await this.quotaService.checkQuotaExceeded(
        workspaceId, 
        resourceType, 
        currentUsage, 
        additionalUsage
      );
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
      await this.calculationService.trackResourceUsage(workspaceId, resourceType, amount, metadata);
      
      // Check for quota warnings
      const currentUsage = await this.calculationService.getWorkspaceUsage(workspaceId);
      await this.quotaService.checkQuotaWarnings(workspaceId, currentUsage);
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
    period: ReportPeriod = 'monthly'
  ): Promise<UsageReport> {
    try {
      return await this.reportingService.generateUsageReport(workspaceId, period);
    } catch (error) {
      logger.error('Failed to generate usage report', { workspaceId, period, error });
      throw new Error(`Failed to generate usage report: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Reset monthly usage counters (archive and reset)
   */
  async resetMonthlyUsage(): Promise<void> {
    try {
      await this.reportingService.archiveMonthlyUsage();
    } catch (error) {
      logger.error('Failed to reset monthly usage', { error });
      throw new Error(`Failed to reset monthly usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Enforce quota limits
   */
  async enforceQuota(
    workspaceId: string,
    resourceType: ResourceType,
    requestedAmount: number
  ): Promise<QuotaEnforcementResult> {
    try {
      const currentUsage = await this.calculationService.getWorkspaceUsage(workspaceId);
      return await this.quotaService.enforceQuota(
        workspaceId, 
        resourceType, 
        currentUsage, 
        requestedAmount
      );
    } catch (error) {
      logger.error('Failed to enforce quota', { workspaceId, resourceType, error });
      // Allow operation on error to avoid blocking users
      return { allowed: true };
    }
  }

  /**
   * Get usage statistics for analytics dashboard
   */
  async getUsageStatistics(workspaceId: string, days: number = 30): Promise<any> {
    try {
      return await this.calculationService.getUsageStatistics(workspaceId, days);
    } catch (error) {
      logger.error('Failed to get usage statistics', { workspaceId, error });
      throw new Error(`Failed to get usage statistics: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get historical usage reports
   */
  async getHistoricalReports(
    workspaceId: string,
    period: ReportPeriod = 'monthly',
    limit: number = 12
  ): Promise<any[]> {
    try {
      return await this.reportingService.getHistoricalReports(workspaceId, period, limit);
    } catch (error) {
      logger.error('Failed to get historical reports', { workspaceId, period, error });
      throw new Error(`Failed to get historical reports: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Generate usage trends analysis
   */
  async generateUsageTrends(workspaceId: string, months: number = 6): Promise<any> {
    try {
      return await this.reportingService.generateUsageTrends(workspaceId, months);
    } catch (error) {
      logger.error('Failed to generate usage trends', { workspaceId, error });
      throw new Error(`Failed to generate usage trends: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Export usage data to CSV format
   */
  async exportUsageData(
    workspaceId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    try {
      return await this.reportingService.exportUsageData(workspaceId, startDate, endDate);
    } catch (error) {
      logger.error('Failed to export usage data', { workspaceId, error });
      throw new Error(`Failed to export usage data: ${getErrorMessage(error)}`);
    }
  }
}