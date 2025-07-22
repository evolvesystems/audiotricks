import { PrismaClient } from '@prisma/client';
import { OpenAIService } from '../integrations/openai.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * Audio transcription service using OpenAI Whisper API
 */
export class TranscriptionService {
  private prisma: PrismaClient;
  private openAIService: OpenAIService;

  constructor() {
    this.prisma = new PrismaClient();
    this.openAIService = new OpenAIService();
  }

  /**
   * Perform audio transcription using OpenAI Whisper
   */
  async performTranscription(job: any): Promise<any> {
    try {
      logger.info('Starting transcription', { jobId: job.id });

      if (!job.audioUpload?.cdnUrl) {
        throw new Error('No audio file URL available for transcription');
      }

      // Update job status
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'transcribing',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Get API key for transcription
      const apiKey = await this.getOpenAIKey(job.userId, job.workspaceId);
      if (!apiKey) {
        throw new Error('No OpenAI API key available for transcription');
      }

      // Perform transcription
      const transcriptionResult = await this.openAIService.transcribeAudio({
        audioUrl: job.audioUpload.cdnUrl,
        apiKey: apiKey,
        options: {
          model: job.config?.transcriptionModel || 'whisper-1',
          language: job.config?.language,
          prompt: job.config?.prompt,
          response_format: 'verbose_json',
          timestamp_granularities: ['word', 'segment']
        }
      });

      // Update job with transcription results
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'transcribed',
          transcriptionData: transcriptionResult,
          updatedAt: new Date()
        }
      });

      logger.info('Transcription completed', { 
        jobId: job.id,
        duration: transcriptionResult.duration,
        wordCount: transcriptionResult.words?.length || 0
      });

      return transcriptionResult;
    } catch (error) {
      logger.error('Transcription failed:', error);
      
      await this.prisma.processingJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          errorMessage: getErrorMessage(error),
          updatedAt: new Date()
        }
      });

      throw new Error(`Transcription failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Process transcription with chunking for large files
   */
  async processLargeFileTranscription(job: any): Promise<any> {
    try {
      logger.info('Processing large file transcription', { jobId: job.id });

      // For files larger than 25MB, we need to chunk them
      const audioUpload = job.audioUpload;
      if (!audioUpload || Number(audioUpload.fileSize) < 25 * 1024 * 1024) {
        // File is small enough for direct processing
        return this.performTranscription(job);
      }

      // TODO: Implement audio chunking logic
      // For now, fallback to direct processing
      logger.warn('Large file chunking not yet implemented, using direct processing', { 
        jobId: job.id,
        fileSize: audioUpload.fileSize 
      });

      return this.performTranscription(job);
    } catch (error) {
      logger.error('Large file transcription failed:', error);
      throw error;
    }
  }

  /**
   * Get OpenAI API key for user/workspace
   */
  private async getOpenAIKey(userId: string, workspaceId?: string | null): Promise<string | null> {
    try {
      // First try workspace-level API key
      if (workspaceId) {
        const workspaceKey = await this.prisma.apiKey.findFirst({
          where: {
            workspaceId,
            service: 'openai',
            isActive: true
          },
          orderBy: { createdAt: 'desc' }
        });

        if (workspaceKey) {
          return workspaceKey.encryptedKey; // This would be decrypted in practice
        }
      }

      // Fallback to user-level API key
      const userKey = await this.prisma.apiKey.findFirst({
        where: {
          userId,
          service: 'openai',
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return userKey ? userKey.encryptedKey : null;
    } catch (error) {
      logger.error('Error getting OpenAI API key:', error);
      return null;
    }
  }

  /**
   * Validate transcription job parameters
   */
  validateTranscriptionJob(job: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!job.audioUpload?.cdnUrl) {
      errors.push('No audio file URL available');
    }

    if (!job.userId) {
      errors.push('No user ID specified');
    }

    // Validate audio file format
    const supportedFormats = ['mp3', 'mp4', 'm4a', 'wav', 'webm'];
    const fileExtension = job.audioUpload?.originalFilename?.split('.').pop()?.toLowerCase();
    
    if (fileExtension && !supportedFormats.includes(fileExtension)) {
      errors.push(`Unsupported audio format: ${fileExtension}`);
    }

    // Validate file size (25MB limit for Whisper API)
    const fileSizeLimit = 25 * 1024 * 1024; // 25MB in bytes
    if (job.audioUpload?.fileSize && Number(job.audioUpload.fileSize) > fileSizeLimit) {
      logger.warn('File exceeds Whisper API limit, will require chunking', {
        jobId: job.id,
        fileSize: job.audioUpload.fileSize
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract key metrics from transcription
   */
  extractTranscriptionMetrics(transcriptionResult: any): {
    duration: number;
    wordCount: number;
    segmentCount: number;
    confidence: number;
    language: string | null;
  } {
    return {
      duration: transcriptionResult.duration || 0,
      wordCount: transcriptionResult.words?.length || 0,
      segmentCount: transcriptionResult.segments?.length || 0,
      confidence: transcriptionResult.words?.reduce((sum: number, word: any) => 
        sum + (word.probability || 0), 0) / (transcriptionResult.words?.length || 1),
      language: transcriptionResult.language || null
    };
  }
}