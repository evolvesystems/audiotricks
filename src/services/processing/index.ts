/**
 * Processing service - Main entry point
 * Refactored into focused modules for CLAUDE.md compliance
 */

import { JobManager } from './job-management';
import { AudioProcessor } from './audio-processor';

export * from './types';
export * from './job-management';
export * from './audio-processor';

/**
 * Main processing service class that combines all functionality
 * Each aspect is handled by a specialized manager
 */
export class ProcessingService {
  public readonly jobs: JobManager;
  public readonly audio: AudioProcessor;

  constructor() {
    this.jobs = new JobManager();
    this.audio = new AudioProcessor();
  }

  // Convenience methods for common operations
  
  /**
   * Quick transcription with default settings
   */
  async quickTranscribe(audioUploadId: string, workspaceId: string) {
    return this.audio.transcribe(audioUploadId, workspaceId);
  }

  /**
   * Quick summary with default settings
   */
  async quickSummarize(audioUploadId: string, workspaceId: string) {
    return this.audio.summarize(audioUploadId, workspaceId);
  }

  /**
   * Get job result (convenience method)
   */
  async getJobResult(jobId: string) {
    return this.jobs.getJob(jobId);
  }

  /**
   * Wait for job completion with polling
   */
  async waitForCompletion(
    jobId: string, 
    options: {
      pollInterval?: number; // milliseconds
      maxWaitTime?: number; // milliseconds
      onProgress?: (progress: number) => void;
    } = {}
  ) {
    const { pollInterval = 2000, maxWaitTime = 300000, onProgress } = options;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      const job = await this.jobs.getJob(jobId);
      
      if (onProgress) {
        onProgress(job.progress);
      }

      if (job.status === 'completed') {
        return job;
      } else if (job.status === 'failed') {
        throw new Error(`Job failed: ${job.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Job completion timeout');
  }
}

// Export singleton instance
export const processingService = new ProcessingService();