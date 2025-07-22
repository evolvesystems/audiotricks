/**
 * Dashboard controller - Handles dashboard statistics and overview data
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get dashboard statistics for the authenticated user
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all workspaces the user has access to
    const userWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId },
      select: { workspaceId: true }
    });

    const workspaceIds = userWorkspaces.map(uw => uw.workspaceId);

    // Get current date range for "this month"
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Parallel queries for better performance
    const [
      totalProjects,
      totalJobs,
      completedJobs,
      processingJobs,
      failedJobs,
      monthlyFiles,
      monthlyStorage,
      monthlyUsage
    ] = await Promise.all([
      // Total projects in user's workspaces
      prisma.project.count({
        where: { workspaceId: { in: workspaceIds } }
      }),
      
      // Total jobs in user's workspaces
      prisma.job.count({
        where: { 
          project: { workspaceId: { in: workspaceIds } }
        }
      }),
      
      // Completed jobs
      prisma.job.count({
        where: { 
          status: 'completed',
          project: { workspaceId: { in: workspaceIds } }
        }
      }),
      
      // Processing jobs
      prisma.job.count({
        where: { 
          status: { in: ['pending', 'processing'] },
          project: { workspaceId: { in: workspaceIds } }
        }
      }),
      
      // Failed jobs
      prisma.job.count({
        where: { 
          status: 'failed',
          project: { workspaceId: { in: workspaceIds } }
        }
      }),
      
      // Audio files this month
      prisma.job.count({
        where: {
          createdAt: { gte: startOfMonth, lte: endOfMonth },
          project: { workspaceId: { in: workspaceIds } }
        }
      }),
      
      // Storage used this month (placeholder - would need to sum from actual files)
      Promise.resolve({ _sum: { size: 0 } }),
      
      // Usage tracking this month
      prisma.usageTracking.count({
        where: {
          workspaceId: { in: workspaceIds },
          timestamp: { gte: startOfMonth, lte: endOfMonth }
        }
      })
    ]);

    const stats = {
      totalProjects,
      totalJobs,
      completedJobs,
      processingJobs,
      failedJobs,
      usageThisMonth: {
        audioFiles: monthlyFiles,
        storageUsed: Math.floor((monthlyStorage._sum.size || 0) / 1024 / 1024), // Convert to MB
        apiCalls: monthlyUsage
      }
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

/**
 * Get recent activity for dashboard
 */
export const getRecentActivity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user workspaces
    const userWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId },
      select: { workspaceId: true }
    });

    const workspaceIds = userWorkspaces.map(uw => uw.workspaceId);

    const [recentProjects, recentJobs] = await Promise.all([
      // Recent projects (last 5, ordered by most recently updated)
      prisma.project.findMany({
        where: { workspaceId: { in: workspaceIds } },
        include: {
          _count: { select: { jobs: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      
      // Recent jobs (last 10)
      prisma.job.findMany({
        where: {
          project: { workspaceId: { in: workspaceIds } }
        },
        include: {
          project: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Transform data for frontend
    const transformedProjects = recentProjects.map(project => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      jobCount: project._count.jobs,
      status: 'active'
    }));

    const transformedJobs = recentJobs.map(job => ({
      id: job.id,
      fileName: job.name || 'Unnamed Job',
      projectId: job.projectId,
      projectName: job.project.name,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      duration: 0 // Duration not available in current schema
    }));

    res.json({
      projects: transformedProjects,
      jobs: transformedJobs
    });
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({ error: 'Failed to fetch recent activity' });
  }
};