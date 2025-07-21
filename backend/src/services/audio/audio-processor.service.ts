import { TranscriptionService } from './transcription.service';
import { AnalysisService } from './analysis.service';
import { JobManagerService, ProcessingResult, ProcessingJob } from './job-manager.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Main audio processor service that orchestrates transcription, analysis, and job management
 * This is the public API that controllers and other services should use
 */
export class AudioProcessorService {
  private transcriptionService: TranscriptionService;
  private analysisService: AnalysisService;
  private jobManagerService: JobManagerService;

  constructor() {
    this.transcriptionService = new TranscriptionService();
    this.analysisService = new AnalysisService();
    this.jobManagerService = new JobManagerService();
  }

  /**
   * Process audio file with specified operations
   */
  async processAudio(params: {
    userId: string;
    workspaceId?: string | null;
    audioUploadId: string;
    operations: string[];
    config?: any;
  }): Promise<{ jobId: string }> {
    try {
      logger.info('Starting audio processing', {
        userId: params.userId,
        audioUploadId: params.audioUploadId,
        operations: params.operations
      });

      // Create processing job
      const job = await this.jobManagerService.createProcessingJob(params);

      // Start processing asynchronously
      this.executeProcessingJob(job.id).catch(error => {
        logger.error('Processing job failed:', { jobId: job.id, error });
      });

      return { jobId: job.id };
    } catch (error) {
      logger.error('Error starting audio processing:', error);
      throw new Error(`Failed to start processing: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Execute processing job steps
   */
  private async executeProcessingJob(jobId: string): Promise<void> {
    try {
      logger.info('Executing processing job', { jobId });

      // Get job details
      const result = await this.jobManagerService.getJobStatus(jobId, ''); // Skip user check for internal use
      
      // Update status to processing
      await this.jobManagerService.updateJobStatus(jobId, 'processing', 10);

      // Get job data from database for processing
      const jobData = await this.getJobWithIncludes(jobId);
      if (!jobData) {
        throw new Error('Job not found');
      }

      // Process operations in sequence
      const operations = jobData.operations || [];
      let currentProgress = 20;
      const progressStep = 60 / operations.length; // Reserve 20% for setup, 20% for completion

      for (const operation of operations) {
        logger.info('Processing operation', { jobId, operation });

        switch (operation) {
          case 'transcribe':
            await this.transcriptionService.performTranscription(jobData);
            break;
          case 'summarize':
            await this.analysisService.performSummarization(jobData);
            break;
          case 'analyze':
            await this.analysisService.performAnalysis(jobData);
            break;
          default:
            logger.warn('Unknown operation', { jobId, operation });
        }

        currentProgress += progressStep;
        await this.jobManagerService.updateJobStatus(jobId, 'processing', currentProgress);
      }

      // Complete the job
      await this.jobManagerService.completeJob(jobId, {});
      
      logger.info('Processing job completed successfully', { jobId });
    } catch (error) {
      logger.error('Processing job failed:', { jobId, error });
      
      await this.jobManagerService.updateJobStatus(
        jobId,
        'failed',
        undefined,
        getErrorMessage(error)
      );
      
      throw error;
    }
  }

  /**
   * Get job status and results
   */
  async getJobStatus(jobId: string, userId: string): Promise<ProcessingResult> {
    return this.jobManagerService.getJobStatus(jobId, userId);
  }

  /**
   * List processing jobs for user
   */
  async listJobs(
    userId: string,
    workspaceId?: string | null,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      orderBy?: 'createdAt' | 'updatedAt';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<{ jobs: ProcessingResult[]; total: number }> {
    return this.jobManagerService.listJobs(userId, workspaceId, options);
  }

  /**
   * Get job data with all required includes for processing
   */
  private async getJobWithIncludes(jobId: string): Promise<any> {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      return await prisma.processingJob.findUnique({
        where: { id: jobId },
        include: {
          audioUpload: true
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  }

  // Legacy compatibility methods
  async performTranscription(job: any): Promise<any> {
    return this.transcriptionService.performTranscription(job);
  }

  async performSummarization(job: any): Promise<any> {
    return this.analysisService.performSummarization(job);
  }

  async performAnalysis(job: any): Promise<any> {
    return this.analysisService.performAnalysis(job);
  }
}

// Re-export types for convenience
export type { ProcessingResult, ProcessingJob };