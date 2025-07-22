import { Request, Response } from 'express';
import { UsageTrackingService } from '../services/usage/usage-tracking.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-handler';

const usageTracking = new UsageTrackingService();
const prisma = new PrismaClient();

/**
 * Get workspace usage and quota
 */
export const getWorkspaceUsage = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: { userId }
        }
      }
    });

    if (!workspace) {
      res.status(403).json({
        error: 'Access denied to workspace'
      });
      return;
    }

    // Get usage and quota
    const [usage, quota] = await Promise.all([
      usageTracking.getWorkspaceUsage(workspaceId),
      usageTracking.getWorkspaceQuota(workspaceId)
    ]);

    res.json({
      workspaceId,
      usage: {
        storage: {
          used: usage.storageBytes.toString(),
          limit: quota.storageBytes.toString(),
          percentUsed: usage.percentUsed.storage
        },
        processing: {
          used: usage.processingMinutes,
          limit: quota.processingMinutes,
          percentUsed: usage.percentUsed.processing
        },
        apiCalls: {
          used: usage.apiCalls,
          limit: quota.apiCalls,
          percentUsed: usage.percentUsed.apiCalls
        },
        transcription: {
          used: usage.transcriptionMinutes,
          limit: quota.transcriptionMinutes,
          percentUsed: usage.percentUsed.transcription
        },
        aiTokens: {
          used: usage.aiTokens,
          limit: quota.aiTokens,
          percentUsed: usage.percentUsed.aiTokens
        }
      }
    });
    return;

  } catch (error) {
    logger.error('Failed to get workspace usage', { error });
    res.status(500).json({
      error: 'Failed to get workspace usage',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Get usage report
 */
export const getUsageReport = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { period = 'monthly' } = req.query;
    const userId = req.user!.id;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: { 
            userId,
            role: { in: ['OWNER', 'ADMIN'] }
          }
        }
      }
    });

    if (!workspace) {
      res.status(403).json({
        error: 'Admin access required for usage reports'
      });
      return;
    }

    const report = await usageTracking.generateUsageReport(
      workspaceId,
      period as 'daily' | 'weekly' | 'monthly'
    );

    res.json(report);
    return;

  } catch (error) {
    logger.error('Failed to generate usage report', { error });
    res.status(500).json({
      error: 'Failed to generate usage report',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Get usage history
 */
export const getUsageHistory = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const { days = '30' } = req.query;
    const userId = req.user!.id;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: { userId }
        }
      }
    });

    if (!workspace) {
      res.status(403).json({
        error: 'Access denied to workspace'
      });
      return;
    }

    const daysAgo = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get usage tracking records
    const usageRecords = await prisma.usageTracking.findMany({
      where: {
        workspaceId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    // Get historical reports
    const reports = await prisma.usageReport.findMany({
      where: {
        workspaceId,
        periodStart: {
          gte: startDate
        }
      },
      orderBy: { periodEnd: 'desc' }
    });

    res.json({
      workspaceId,
      period: `${daysAgo} days`,
      records: usageRecords.map(record => ({
        id: record.id,
        resourceType: record.resourceType,
        amount: record.quantity.toString(),
        metadata: record.metadata,
        timestamp: record.timestamp
      })),
      reports: reports.map(report => ({
        id: report.id,
        period: report.reportType,
        startDate: report.periodStart,
        endDate: report.periodEnd,
        storage: report.totalStorage.toString(),
        processing: report.totalMinutes,
        uploads: report.totalUploads,
        reportData: report.reportData
      }))
    });
    return;

  } catch (error) {
    logger.error('Failed to get usage history', { error });
    res.status(500).json({
      error: 'Failed to get usage history',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Check specific quota
 */
export const checkQuota = async (req: Request, res: Response) => {
  try {
    const { workspaceId, resourceType } = req.params;
    const { amount = '0' } = req.query;
    const userId = req.user!.id;

    // Verify user has access to workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: { userId }
        }
      }
    });

    if (!workspace) {
      res.status(403).json({
        error: 'Access denied to workspace'
      });
      return;
    }

    const validResourceTypes = ['storage', 'processing', 'apiCalls', 'transcription', 'aiTokens'];
    if (!validResourceTypes.includes(resourceType)) {
      res.status(400).json({
        error: `Invalid resource type. Must be one of: ${validResourceTypes.join(', ')}`
      });
      return;
    }

    const quotaCheck = await usageTracking.checkQuotaExceeded(
      workspaceId,
      resourceType as any,
      parseInt(amount as string)
    );

    res.json({
      resourceType,
      current: quotaCheck.current,
      limit: quotaCheck.limit,
      percentUsed: quotaCheck.percentUsed,
      exceeded: quotaCheck.exceeded,
      available: quotaCheck.limit - quotaCheck.current
    });
    return;

  } catch (error) {
    logger.error('Failed to check quota', { error });
    res.status(500).json({
      error: 'Failed to check quota',
      details: getErrorMessage(error)
    });
    return;
  }
};