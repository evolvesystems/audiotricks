/**
 * Job controller - Handles transcription job operations
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const getJobs = async (req: Request, res: Response) => {
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

    const jobs = await prisma.job.findMany({
      where: {
        project: {
          workspaceId: { in: workspaceIds }
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform jobs to match frontend expectations
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      fileName: job.fileName,
      originalFileName: job.originalFileName || job.fileName,
      projectId: job.projectId,
      projectName: job.project.name,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      duration: job.duration || 0,
      fileSize: job.fileSize || 0,
      transcriptionText: job.transcription,
      confidence: job.confidence,
      language: job.language || 'en',
      results: {
        transcription: job.transcription,
        summary: job.summary,
        keyMoments: job.keyMoments,
        confidence: job.confidence
      }
    }));

    res.json({ jobs: transformedJobs });
  } catch (error) {
    logger.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

export const getJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        project: {
          workspace: {
            users: {
              some: { userId }
            }
          }
        }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Transform job to include all details
    const transformedJob = {
      id: job.id,
      fileName: job.fileName,
      originalFileName: job.originalFileName || job.fileName,
      projectId: job.projectId,
      projectName: job.project.name,
      status: job.status,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      duration: job.duration || 0,
      fileSize: job.fileSize || 0,
      transcriptionText: job.transcription,
      summary: job.summary,
      keyMoments: job.keyMoments,
      confidence: job.confidence,
      language: job.language || 'en',
      audioUrl: job.audioUrl,
      storageUrl: job.storageUrl,
      settings: job.settings
    };

    res.json(transformedJob);
  } catch (error) {
    logger.error('Error fetching job:', error);
    res.status(500).json({ error: 'Failed to fetch job' });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { transcription, summary, keyMoments } = req.body;

    // Check if user has access to this job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        project: {
          workspace: {
            users: {
              some: { userId }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        transcription: transcription !== undefined ? transcription : job.transcription,
        summary: summary !== undefined ? summary : job.summary,
        keyMoments: keyMoments !== undefined ? keyMoments : job.keyMoments,
        updatedAt: new Date()
      }
    });

    res.json(updatedJob);
  } catch (error) {
    logger.error('Error updating job:', error);
    res.status(500).json({ error: 'Failed to update job' });
  }
};

export const retryJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has access to this job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        status: 'failed',
        project: {
          workspace: {
            users: {
              some: { userId }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or not in failed state' });
    }

    // Update job status to pending to retry
    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'pending',
        error: null,
        updatedAt: new Date()
      }
    });

    // TODO: Trigger job processing queue

    res.json({ success: true, job: updatedJob });
  } catch (error) {
    logger.error('Error retrying job:', error);
    res.status(500).json({ error: 'Failed to retry job' });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const jobId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has access to this job
    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
        project: {
          workspace: {
            users: {
              some: { userId, role: { in: ['owner', 'admin'] } }
            }
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found or insufficient permissions' });
    }

    await prisma.job.delete({
      where: { id: jobId }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting job:', error);
    res.status(500).json({ error: 'Failed to delete job' });
  }
};