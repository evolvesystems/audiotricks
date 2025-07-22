import { Request, Response } from 'express';
import { AudioProcessorService } from '../services/audio/audio-processor.service';
import { UsageTrackingService } from '../services/usage/usage-tracking.service';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-handler';

const audioProcessor = new AudioProcessorService();
const usageTracking = new UsageTrackingService();
const prisma = new PrismaClient();

/**
 * Start audio processing
 */
export const startProcessing = async (req: Request, res: Response) => {
  try {
    const { uploadId, jobType, options = {} } = req.body;

    if (!uploadId || !jobType) {
      return res.status(400).json({
        error: 'Upload ID and job type are required'
      });
    }

    const validJobTypes = ['transcription', 'summary', 'analysis'];
    if (!validJobTypes.includes(jobType)) {
      return res.status(400).json({
        error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`
      });
    }

    // Get upload info for quota checking
    const upload = await prisma.audioUpload.findUnique({
      where: { id: uploadId },
      select: {
        workspaceId: true,
        fileSize: true,
        userId: true
      }
    });

    if (!upload) {
      return res.status(404).json({
        error: 'Upload not found'
      });
    }

    // Check quotas based on job type
    if (jobType === 'transcription') {
      // Estimate transcription minutes based on file size
      const estimatedMinutes = Math.ceil(Number(upload.fileSize) / (1024 * 1024 * 10)); // 10MB per minute
      const quotaCheck = await usageTracking.enforceQuota(
        upload.workspaceId,
        'transcription',
        estimatedMinutes
      );
      
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'Transcription quota exceeded',
          message: quotaCheck.reason,
          suggestion: quotaCheck.suggestion
        });
      }
    } else if (jobType === 'summary' || jobType === 'analysis') {
      // Check AI tokens quota
      const quotaCheck = await usageTracking.enforceQuota(
        upload.workspaceId,
        'aiTokens',
        5000 // Estimated tokens for summary/analysis
      );
      
      if (!quotaCheck.allowed) {
        return res.status(429).json({
          error: 'AI tokens quota exceeded',
          message: quotaCheck.reason,
          suggestion: quotaCheck.suggestion
        });
      }
    }

    const result = await audioProcessor.processAudio({
      userId: upload.userId,
      workspaceId: upload.workspaceId,
      audioUploadId: uploadId,
      operations: [jobType],
      config: options
    });

    res.json({
      success: true,
      job: result
    });
    return;

  } catch (error) {
    logger.error('Failed to start processing', { error });
    res.status(500).json({
      error: 'Failed to start processing',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Get processing job status
 */
export const getJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    const job = await audioProcessor.getJobStatus(jobId, userId);

    res.json(job);
    return;

  } catch (error) {
    if (error instanceof Error && error.message === 'Job not found') {
      return res.status(404).json({ error: 'Job not found' });
    }

    logger.error('Failed to get job status', { error });
    res.status(500).json({
      error: 'Failed to get job status',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * List processing jobs
 */
export const listJobs = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      workspaceId,
      status,
      jobType,
      limit = '20',
      offset = '0'
    } = req.query;

    const jobOptions = {
      status: status as string,
      jobType: jobType as string,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    };

    const result = await audioProcessor.listJobs(userId, workspaceId as string, jobOptions);

    res.json({
      jobs: result.jobs,
      pagination: {
        total: result.total,
        limit: jobOptions.limit,
        offset: jobOptions.offset,
        hasMore: jobOptions.offset + jobOptions.limit < result.total
      }
    });
    return;

  } catch (error) {
    logger.error('Failed to list jobs', { error });
    res.status(500).json({
      error: 'Failed to list jobs',
      details: getErrorMessage(error)
    });
    return;
  }
};