import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { UsageReport, ReportPeriod } from './types';
import { QuotaManagementService } from './quota-management.service';
import { UsageCalculationService } from './usage-calculation.service';
import { ReportingUtils } from './reporting-utils';

const prisma = new PrismaClient();

/**
 * Service for generating usage reports and managing historical usage data
 */
export class UsageReportingService {
  private quotaService = new QuotaManagementService();
  private calculationService = new UsageCalculationService();

  /**
   * Generate comprehensive usage report for a workspace
   */
  async generateUsageReport(
    workspaceId: string,
    period: ReportPeriod = 'monthly'
  ): Promise<UsageReport> {
    try {
      const { startDate, endDate } = ReportingUtils.getReportDateRange(period);
      
      const [usage, quota] = await Promise.all([
        this.calculationService.getWorkspaceUsage(workspaceId, startDate, endDate),
        this.quotaService.getWorkspaceQuota(workspaceId)
      ]);

      const costs = this.calculationService.calculateUsageCosts(usage);

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
   * Get historical usage reports for a workspace
   */
  async getHistoricalReports(
    workspaceId: string,
    period: ReportPeriod = 'monthly',
    limit: number = 12
  ): Promise<any[]> {
    try {
      return await prisma.usageReport.findMany({
        where: {
          workspaceId,
          period
        },
        orderBy: {
          startDate: 'desc'
        },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get historical reports', { workspaceId, period, error });
      throw new Error(`Failed to get historical reports: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Archive monthly usage data for all active workspaces
   */
  async archiveMonthlyUsage(): Promise<void> {
    try {
      const workspaces = await prisma.workspace.findMany({
        where: { isActive: true }
      });

      const archivePromises = workspaces.map(workspace => 
        this.archiveWorkspaceUsage(workspace.id)
      );

      await Promise.all(archivePromises);

      logger.info('Monthly usage archived for all workspaces', {
        workspaceCount: workspaces.length
      });
    } catch (error) {
      logger.error('Failed to archive monthly usage', { error });
      throw new Error(`Failed to archive monthly usage: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Archive usage for a specific workspace
   */
  private async archiveWorkspaceUsage(workspaceId: string): Promise<void> {
    try {
      const report = await this.generateUsageReport(workspaceId, 'monthly');
      
      await prisma.usageReport.create({
        data: {
          workspaceId,
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
        workspaceId,
        period: report.period,
        totalCost: report.costs.total
      });
    } catch (error) {
      logger.error('Failed to archive workspace usage', { workspaceId, error });
      // Continue with other workspaces even if one fails
    }
  }

  /**
   * Generate usage trends analysis
   */
  async generateUsageTrends(
    workspaceId: string,
    months: number = 6
  ): Promise<any> {
    try {
      const reports = await this.getHistoricalReports(workspaceId, 'monthly', months);
      
      if (reports.length < 2) {
        return {
          trend: 'insufficient_data',
          message: 'Not enough historical data for trend analysis'
        };
      }

      const latest = reports[0];
      const previous = reports[1];

      const storageGrowth = ReportingUtils.calculateGrowthPercentage(
        Number(latest.storageBytes),
        Number(previous.storageBytes)
      );

      const processingGrowth = ReportingUtils.calculateGrowthPercentage(
        latest.processingMinutes,
        previous.processingMinutes
      );

      const apiCallsGrowth = ReportingUtils.calculateGrowthPercentage(
        latest.apiCalls,
        previous.apiCalls
      );

      return {
        trend: 'calculated',
        period: `${months} months`,
        growth: {
          storage: storageGrowth,
          processing: processingGrowth,
          apiCalls: apiCallsGrowth
        },
        averageMonthlyCost: reports.reduce((sum, r) => sum + r.totalCost, 0) / reports.length,
        totalHistoricalReports: reports.length
      };
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
      const usage = await this.calculationService.getWorkspaceUsage(workspaceId, startDate, endDate);
      const costs = this.calculationService.calculateUsageCosts(usage);

      const csvHeaders = ReportingUtils.getCsvHeaders();
      const csvData = ReportingUtils.formatUsageForCsv(
        startDate,
        endDate,
        usage.storageBytes,
        usage.processingMinutes,
        usage.apiCalls,
        usage.transcriptionMinutes,
        usage.aiTokens,
        costs.total
      );

      return [csvHeaders.join(','), csvData.join(',')].join('\n');
    } catch (error) {
      logger.error('Failed to export usage data', { workspaceId, error });
      throw new Error(`Failed to export usage data: ${getErrorMessage(error)}`);
    }
  }
}