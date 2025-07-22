import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

export interface ProcessingResult {
  jobId: string;
  status: string;
  progress: number;
  results?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProcessingJob {
  id: string;
  userId: string;
  workspaceId?: string | null;
  audioUploadId: string;
  status: string;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Audio processing job management service
 */
export class JobManagerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new processing job
   */
  async createProcessingJob(params: {
    userId: string;
    workspaceId?: string | null;
    audioUploadId: string;
    operations: string[];
    config?: any;
  }): Promise<ProcessingJob> {
    try {
      logger.info('Creating processing job', {
        userId: params.userId,
        audioUploadId: params.audioUploadId,
        operations: params.operations
      });

      const job = await this.prisma.processingJob.create({
        data: {
          userId: params.userId,
          workspaceId: params.workspaceId,
          audioUploadId: params.audioUploadId,
          operations: params.operations,
          status: 'pending',
          config: params.config || {},
          progress: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('Processing job created', { jobId: job.id });

      return {
        id: job.id,
        userId: job.userId,
        workspaceId: job.workspaceId,
        audioUploadId: job.audioUploadId,
        status: job.status,
        config: job.config,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    } catch (error) {
      logger.error('Error creating processing job:', error);
      throw new Error(`Failed to create processing job: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get job status and results
   */
  async getJobStatus(jobId: string, userId: string): Promise<ProcessingResult> {
    try {
      const job = await this.prisma.processingJob.findFirst({
        where: {
          id: jobId,
          userId: userId
        },
        include: {
          audioUpload: true
        }
      });

      if (!job) {
        throw new Error('Job not found or access denied');
      }

      // Build results object based on completed operations
      const results: any = {};

      if (job.transcriptionData) {
        results.transcription = job.transcriptionData;
      }

      if (job.summaryData) {
        results.summary = job.summaryData;
      }

      if (job.analysisData) {
        results.analysis = job.analysisData;
      }

      return {
        jobId: job.id,
        status: job.status,
        progress: job.progress || 0,
        results: Object.keys(results).length > 0 ? results : undefined,
        error: job.errorMessage || undefined,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      };
    } catch (error) {
      logger.error('Error getting job status:', error);
      throw new Error(`Failed to get job status: ${getErrorMessage(error)}`);
    }
  }

  /**
   * List processing jobs for user
   */
  async listJobs(
    userId: string,
    workspaceId?: string | null,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      orderBy?: 'createdAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    } = {}
  ): Promise<{ jobs: ProcessingResult[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        status,
        orderBy = 'createdAt',
        orderDirection = 'desc'
      } = options;

      const where: any = { userId };
      if (workspaceId) {
        where.workspaceId = workspaceId;
      }
      if (status) {
        where.status = status;
      }

      const [jobs, total] = await Promise.all([
        this.prisma.processingJob.findMany({
          where,
          include: {
            audioUpload: {
              select: {
                originalFilename: true,
                fileSize: true,
                duration: true
              }
            }
          },
          orderBy: { [orderBy]: orderDirection },
          take: limit,
          skip: offset
        }),
        this.prisma.processingJob.count({ where })
      ]);

      const jobResults = jobs.map(job => ({
        jobId: job.id,
        status: job.status,
        progress: job.progress || 0,
        results: this.buildJobResults(job),
        error: job.errorMessage || undefined,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }));

      return { jobs: jobResults, total };
    } catch (error) {
      logger.error('Error listing jobs:', error);
      throw new Error(`Failed to list jobs: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Update job status and progress
   */
  async updateJobStatus(
    jobId: string,
    status: string,
    progress?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status,
          progress: progress ?? undefined,
          errorMessage: errorMessage ?? undefined,
          updatedAt: new Date(),
          ...(status === 'processing' && { startedAt: new Date() }),
          ...(status === 'completed' && { completedAt: new Date() })
        }
      });

      logger.info('Job status updated', { jobId, status, progress });
    } catch (error) {
      logger.error('Error updating job status:', error);
      throw new Error(`Failed to update job status: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Mark job as completed with final results
   */
  async completeJob(jobId: string, results: any): Promise<void> {
    try {
      await this.prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info('Job completed successfully', { jobId });
    } catch (error) {
      logger.error('Error completing job:', error);
      throw new Error(`Failed to complete job: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Delete old completed jobs (cleanup)
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.prisma.processingJob.deleteMany({
        where: {
          status: { in: ['completed', 'failed'] },
          completedAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info('Old jobs cleaned up', { 
        deletedCount: result.count,
        olderThanDays 
      });

      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      throw new Error(`Failed to cleanup old jobs: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Build results object from job data
   */
  private buildJobResults(job: any): any {
    const results: any = {};

    if (job.transcriptionData) {
      results.transcription = job.transcriptionData;
    }

    if (job.summaryData) {
      results.summary = job.summaryData;
    }

    if (job.analysisData) {
      results.analysis = job.analysisData;
    }

    return Object.keys(results).length > 0 ? results : undefined;
  }
}