import { ReportPeriod } from './types';

/**
 * Utility functions for usage reporting
 */
export class ReportingUtils {
  
  /**
   * Get date range for different report periods
   */
  static getReportDateRange(period: ReportPeriod): { startDate: Date; endDate: Date } {
    let startDate: Date;
    const endDate = new Date();

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
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Calculate growth percentage between two values
   */
  static calculateGrowthPercentage(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Format CSV headers for usage export
   */
  static getCsvHeaders(): string[] {
    return [
      'Date Range',
      'Storage (GB)',
      'Processing (Minutes)',
      'API Calls',
      'Transcription (Minutes)',
      'AI Tokens',
      'Total Cost ($)'
    ];
  }

  /**
   * Format usage data for CSV export
   */
  static formatUsageForCsv(
    startDate: Date,
    endDate: Date,
    storageBytes: bigint,
    processingMinutes: number,
    apiCalls: number,
    transcriptionMinutes: number,
    aiTokens: number,
    totalCost: number
  ): string[] {
    return [
      `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      (Number(storageBytes) / (1024 * 1024 * 1024)).toFixed(2),
      processingMinutes.toString(),
      apiCalls.toString(),
      transcriptionMinutes.toString(),
      aiTokens.toString(),
      totalCost.toFixed(2)
    ];
  }
}