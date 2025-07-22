import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import { OpenAIService } from '../integrations/openai.service';

const prisma = new PrismaClient();

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  response_format?: string;
  temperature?: number;
}

export interface ProcessingResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}

export class AudioProcessorService {
  private openAIService: OpenAIService;

  constructor() {
    this.openAIService = new OpenAIService();
  }
  
  /**
   * Start processing an uploaded audio file
   */
  async processAudio(
    uploadId: string,
    jobType: 'transcription' | 'summary' | 'analysis',
    options: TranscriptionOptions = {}
  ): Promise<ProcessingResult> {
    try {
      // Get upload info
      const upload = await prisma.audioUpload.findUnique({
        where: { id: uploadId },
        include: { user: true, workspace: true }
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      if (upload.uploadStatus !== 'completed') {
        throw new Error('Upload not completed');
      }

      // Create processing job
      const job = await prisma.processingJob.create({
        data: {
          uploadId,
          jobType,
          status: 'queued',
          metadata: JSON.parse(JSON.stringify({
            options,
            originalFileName: upload.originalFileName,
            fileSize: upload.fileSize.toString()
          }))
        }
      });

      logger.info('Processing job created', {
        jobId: job.id,
        uploadId,
        jobType,
        userId: upload.userId
      });

      // Start processing (in a real implementation, this would be queued)
      this.executeProcessingJob(job.id).catch(error => {
        logger.error('Processing job failed', { jobId: job.id, error });
      });

      return {
        jobId: job.id,
        status: 'queued',
        progress: 0
      };

    } catch (error) {
      logger.error('Failed to start audio processing', { uploadId, jobType, error });
      throw error;
    }
  }

  /**
   * Execute a processing job
   */
  private async executeProcessingJob(jobId: string): Promise<void> {
    try {
      // Update job status
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'processing',
          startedAt: new Date(),
          progress: 10
        }
      });

      const job = await prisma.processingJob.findUnique({
        where: { id: jobId },
        include: {
          upload: {
            include: { user: true }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      let result: any = {};

      // Simulate processing based on job type
      switch (job.jobType) {
        case 'transcription':
          result = await this.performTranscription(job);
          break;
        case 'summary':
          result = await this.performSummarization(job);
          break;
        case 'analysis':
          result = await this.performAnalysis(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Update job as completed
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          completedAt: new Date(),
          result
        }
      });

      // Create audio history entry
      if (job.jobType === 'transcription') {
        await this.createAudioHistoryEntry(job, result);
      }

      logger.info('Processing job completed', { jobId });

    } catch (error) {
      // Mark job as failed
      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: getErrorMessage(error),
          completedAt: new Date()
        }
      });

      throw error;
    }
  }

  /**
   * Perform transcription using OpenAI Whisper
   */
  private async performTranscription(job: any): Promise<any> {
    // Update progress
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { progress: 30 }
    });

    try {
      // Get audio URL
      const audioUrl = job.upload.cdnUrl || job.upload.storageUrl;
      if (!audioUrl) {
        throw new Error('No audio URL available');
      }

      // Call OpenAI service
      const transcriptionResult = await this.openAIService.transcribeAudio(
        job.upload.userId,
        audioUrl,
        job.uploadId,
        job.metadata.options || {}
      );

      await prisma.processingJob.update({
        where: { id: job.id },
        data: { progress: 80 }
      });

      // Format result for storage
      const result = {
        transcript: transcriptionResult.text,
        language: transcriptionResult.language || 'en',
        confidence: 0.95, // OpenAI doesn't provide confidence scores
        duration: transcriptionResult.duration || 0,
        speakers: 1, // Basic speaker count
        segments: transcriptionResult.segments?.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          speaker: "Speaker 1", // Basic speaker assignment
          confidence: 0.95
        })) || []
      };

      // If segments weren't provided, create a single segment
      if (result.segments.length === 0 && result.transcript) {
        result.segments = [{
          start: 0,
          end: result.duration || 60,
          text: result.transcript,
          speaker: "Speaker 1",
          confidence: 0.95
        }];
      }

      return result;

    } catch (error) {
      logger.error('Transcription failed', { jobId: job.id, error });
      throw new Error(`Transcription failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Perform summarization using OpenAI GPT
   */
  private async performSummarization(job: any): Promise<any> {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { progress: 50 }
    });

    try {
      // First, we need the transcription
      const transcriptionJob = await prisma.processingJob.findFirst({
        where: {
          uploadId: job.uploadId,
          jobType: 'transcription',
          status: 'completed'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!transcriptionJob || !transcriptionJob.result) {
        throw new Error('No transcription available for summarization');
      }

      const transcriptText = (transcriptionJob.result as any).transcript;

      // Generate summary
      const summaryResult = await this.openAIService.generateSummary(
        job.upload.userId,
        transcriptText,
        job.uploadId,
        {
          model: 'gpt-3.5-turbo',
          maxTokens: 500,
          temperature: 0.7
        }
      );

      // Extract key points from the summary
      const keyPointsResult = await this.openAIService.generateSummary(
        job.upload.userId,
        transcriptText,
        job.uploadId,
        {
          model: 'gpt-3.5-turbo',
          maxTokens: 300,
          temperature: 0.5,
          systemPrompt: 'Extract 3-5 key points from the following text. List them as bullet points, one per line.'
        }
      );

      // Analyze topics
      const topicsAnalysis = await this.openAIService.analyzeTranscription(
        job.upload.userId,
        transcriptText,
        job.uploadId,
        'topics'
      );

      return {
        summary: summaryResult.summary,
        keyPoints: keyPointsResult.summary.split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('•')).map(line => line.replace(/^[-•]\s*/, '')),
        sentiment: "neutral", // Could be enhanced with sentiment analysis
        topics: this.extractTopics(topicsAnalysis.analysis),
        tokensUsed: summaryResult.tokensUsed + keyPointsResult.tokensUsed + topicsAnalysis.tokensUsed,
        cost: summaryResult.cost + keyPointsResult.cost + topicsAnalysis.cost
      };

    } catch (error) {
      logger.error('Summarization failed', { jobId: job.id, error });
      throw new Error(`Summarization failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Extract topics from analysis result
   */
  private extractTopics(analysisText: string): string[] {
    // Simple extraction - could be enhanced
    const topics: string[] = [];
    const lines = analysisText.split('\n');
    
    for (const line of lines) {
      if (line.includes('topic') || line.includes('theme')) {
        // Extract words that look like topics
        const matches = line.match(/["']([^"']+)["']/g);
        if (matches) {
          topics.push(...matches.map(m => m.replace(/["']/g, '')));
        }
      }
    }

    return topics.slice(0, 5); // Return top 5 topics
  }

  /**
   * Perform analysis using OpenAI
   */
  private async performAnalysis(job: any): Promise<any> {
    await prisma.processingJob.update({
      where: { id: job.id },
      data: { progress: 60 }
    });

    try {
      // First, we need the transcription
      const transcriptionJob = await prisma.processingJob.findFirst({
        where: {
          uploadId: job.uploadId,
          jobType: 'transcription',
          status: 'completed'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!transcriptionJob || !transcriptionJob.result) {
        throw new Error('No transcription available for analysis');
      }

      const transcriptText = (transcriptionJob.result as any).transcript;
      const transcriptDuration = (transcriptionJob.result as any).duration || 120;

      // Perform sentiment analysis
      const sentimentAnalysis = await this.openAIService.analyzeTranscription(
        job.upload.userId,
        transcriptText,
        job.uploadId,
        'sentiment'
      );

      // Extract entities
      const entitiesAnalysis = await this.openAIService.analyzeTranscription(
        job.upload.userId,
        transcriptText,
        job.uploadId,
        'entities'
      );

      // Calculate basic metrics
      const wordCount = transcriptText.split(/\s+/).length;
      const averagePace = Math.round((wordCount / transcriptDuration) * 60); // words per minute

      // Parse sentiment result
      let emotionalTone = "neutral";
      if (sentimentAnalysis.analysis.toLowerCase().includes('positive')) {
        emotionalTone = "positive";
      } else if (sentimentAnalysis.analysis.toLowerCase().includes('negative')) {
        emotionalTone = "negative";
      }

      return {
        speakerCount: (transcriptionJob.result as any).speakers || 1,
        averagePace,
        emotionalTone,
        sentiment: sentimentAnalysis.analysis,
        entities: this.extractEntities(entitiesAnalysis.analysis),
        wordCount,
        duration: transcriptDuration,
        backgroundNoise: "minimal", // Could be enhanced with audio analysis
        audioQuality: "good", // Could be enhanced with audio analysis
        tokensUsed: sentimentAnalysis.tokensUsed + entitiesAnalysis.tokensUsed,
        cost: sentimentAnalysis.cost + entitiesAnalysis.cost
      };

    } catch (error) {
      logger.error('Analysis failed', { jobId: job.id, error });
      throw new Error(`Analysis failed: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Extract entities from analysis result
   */
  private extractEntities(analysisText: string): Record<string, string[]> {
    const entities: Record<string, string[]> = {
      people: [],
      organizations: [],
      locations: [],
      dates: [],
      products: []
    };

    const lines = analysisText.split('\n');
    let currentCategory = '';

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('people') || lowerLine.includes('person')) {
        currentCategory = 'people';
      } else if (lowerLine.includes('organization')) {
        currentCategory = 'organizations';
      } else if (lowerLine.includes('location') || lowerLine.includes('place')) {
        currentCategory = 'locations';
      } else if (lowerLine.includes('date') || lowerLine.includes('time')) {
        currentCategory = 'dates';
      } else if (lowerLine.includes('product') || lowerLine.includes('service')) {
        currentCategory = 'products';
      } else if (currentCategory && line.trim().startsWith('-')) {
        const entity = line.trim().substring(1).trim();
        if (entity && entities[currentCategory]) {
          entities[currentCategory].push(entity);
        }
      }
    }

    return entities;
  }

  /**
   * Create audio history entry
   */
  private async createAudioHistoryEntry(job: any, transcriptionResult: any): Promise<void> {
    try {
      const audioHistory = await prisma.audioHistory.create({
        data: {
          userId: job.upload.userId,
          workspaceId: job.upload.workspaceId,
          processingJobId: job.id,
          title: job.upload.originalFileName.replace(/\.[^/.]+$/, ""), // Remove extension
          audioUrl: job.upload.storageUrl,
          fileSizeBytes: job.upload.fileSize,
          durationSeconds: transcriptionResult.duration,
          transcript: transcriptionResult.transcript,
          language: transcriptionResult.language,
          confidence: transcriptionResult.confidence,
          speakers: transcriptionResult.speakers,
          tags: []
        }
      });

      // Create audio segments
      if (transcriptionResult.segments) {
        for (const segment of transcriptionResult.segments) {
          await prisma.audioSegment.create({
            data: {
              audioHistoryId: audioHistory.id,
              userId: job.upload.userId,
              startTime: segment.start,
              endTime: segment.end,
              text: segment.text,
              speaker: segment.speaker,
              confidence: segment.confidence,
              keywords: [],
              sentiment: 'neutral'
            }
          });
        }
      }

      logger.info('Audio history entry created', {
        audioHistoryId: audioHistory.id,
        jobId: job.id
      });

    } catch (error) {
      logger.error('Failed to create audio history entry', { jobId: job.id, error });
      // Don't throw here as the main processing was successful
    }
  }

  /**
   * Get processing job status
   */
  async getJobStatus(jobId: string, userId: string): Promise<ProcessingResult> {
    const job = await prisma.processingJob.findFirst({
      where: {
        id: jobId,
        upload: {
          userId
        }
      },
      include: {
        upload: true,
        audioHistory: true
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return {
      jobId: job.id,
      status: job.status as any,
      progress: job.progress,
      result: job.result,
      error: job.error || undefined
    };
  }

  /**
   * List processing jobs for a user
   */
  async listJobs(
    userId: string,
    options: {
      workspaceId?: string;
      status?: string;
      jobType?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ jobs: any[]; total: number }> {
    const where: any = {
      upload: {
        userId
      }
    };

    if (options.workspaceId) {
      where.upload.workspaceId = options.workspaceId;
    }

    if (options.status) {
      where.status = options.status;
    }

    if (options.jobType) {
      where.jobType = options.jobType;
    }

    const [jobs, total] = await Promise.all([
      prisma.processingJob.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 20,
        skip: options.offset || 0,
        include: {
          upload: {
            select: {
              originalFileName: true,
              fileSize: true,
              workspace: {
                select: { name: true }
              }
            }
          },
          audioHistory: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      prisma.processingJob.count({ where })
    ]);

    return {
      jobs: jobs.map(job => ({
        id: job.id,
        type: job.jobType,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
        upload: {
          fileName: job.upload.originalFileName,
          fileSize: job.upload.fileSize.toString(),
          workspace: job.upload.workspace.name
        },
        audioHistory: job.audioHistory ? {
          id: job.audioHistory.id,
          title: job.audioHistory.title
        } : null
      })),
      total
    };
  }
}