import { apiClient, ApiError, ProcessingJob, PaginatedResponse } from './api';

export interface StartProcessingRequest {
  uploadId: string;
  jobType: 'transcription' | 'summary' | 'analysis';
  options?: {
    language?: string;
    prompt?: string;
    temperature?: number;
    format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    model?: string;
    maxTokens?: number;
    systemPrompt?: string;
  };
}

export interface StartProcessingResponse {
  success: boolean;
  job: {
    jobId: string;
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
  };
}

export interface JobResult {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    // Transcription result
    transcript?: string;
    language?: string;
    confidence?: number;
    duration?: number;
    speakers?: number;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      speaker?: string;
      confidence?: number;
    }>;
    
    // Summary result
    summary?: string;
    keyPoints?: string[];
    sentiment?: string;
    topics?: string[];
    tokensUsed?: number;
    cost?: number;
    
    // Analysis result
    speakerCount?: number;
    averagePace?: number;
    emotionalTone?: string;
    entities?: Record<string, string[]>;
    wordCount?: number;
    backgroundNoise?: string;
    audioQuality?: string;
  };
  error?: string;
}

export interface JobListParams {
  workspaceId?: string;
  status?: 'queued' | 'processing' | 'completed' | 'failed';
  jobType?: 'transcription' | 'summary' | 'analysis';
  limit?: number;
  offset?: number;
}

export class ProcessingService {
  /**
   * Start audio processing
   */
  static async startProcessing(request: StartProcessingRequest): Promise<StartProcessingResponse> {
    try {
      return await apiClient.post<StartProcessingResponse>('/processing/start', request);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isQuotaError) {
          const jobType = request.jobType;
          let quotaType = 'processing';
          
          if (jobType === 'transcription') {
            quotaType = 'transcription';
          } else if (jobType === 'summary' || jobType === 'analysis') {
            quotaType = 'AI tokens';
          }
          
          throw new ApiError(
            429,
            `${quotaType} quota exceeded`,
            error.details,
            error.suggestion || `Upgrade your plan for more ${quotaType} capacity`
          );
        }
        
        if (error.status === 404) {
          throw new ApiError(404, 'Upload not found. Please upload a file first.');
        }
        
        if (error.status === 400) {
          throw new ApiError(400, error.message || 'Invalid processing request');
        }
      }
      throw error;
    }
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string): Promise<JobResult> {
    try {
      return await apiClient.get<JobResult>(`/processing/job/${jobId}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(404, 'Processing job not found');
      }
      throw error;
    }
  }

  /**
   * List processing jobs
   */
  static async listJobs(params: JobListParams = {}): Promise<PaginatedResponse<ProcessingJob>> {
    return apiClient.get('/processing/jobs', params);
  }

  /**
   * Cancel a processing job
   */
  static async cancelJob(jobId: string): Promise<void> {
    await apiClient.delete(`/processing/job/${jobId}`);
  }

  /**
   * Retry a failed job
   */
  static async retryJob(jobId: string): Promise<StartProcessingResponse> {
    return apiClient.post(`/processing/job/${jobId}/retry`);
  }

  /**
   * Poll job status until completion
   */
  static async pollJobStatus(
    jobId: string,
    onProgress?: (progress: number, status: string) => void,
    pollInterval: number = 2000
  ): Promise<JobResult> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const result = await this.getJobStatus(jobId);
          
          if (onProgress) {
            onProgress(result.progress, result.status);
          }
          
          if (result.status === 'completed') {
            resolve(result);
          } else if (result.status === 'failed') {
            reject(new ApiError(500, result.error || 'Processing failed'));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      poll();
    });
  }

  /**
   * Get processing cost estimate
   */
  static estimateProcessingCost(
    fileSize: number,
    jobType: 'transcription' | 'summary' | 'analysis'
  ): { estimatedCost: number; estimatedTokens?: number; estimatedMinutes?: number } {
    const fileSizeMB = fileSize / (1024 * 1024);
    
    switch (jobType) {
      case 'transcription':
        // Rough estimate: 1 minute per 10MB, $0.001 per minute
        const estimatedMinutes = Math.ceil(fileSizeMB / 10);
        return {
          estimatedCost: estimatedMinutes * 0.001,
          estimatedMinutes
        };
        
      case 'summary':
      case 'analysis':
        // Estimate tokens based on expected transcript length
        const estimatedTranscriptLength = fileSizeMB * 1000; // rough estimate
        const estimatedTokens = Math.ceil(estimatedTranscriptLength / 4);
        const costPerToken = 0.000015; // GPT-3.5 turbo cost
        
        return {
          estimatedCost: estimatedTokens * costPerToken,
          estimatedTokens
        };
        
      default:
        return { estimatedCost: 0 };
    }
  }

  /**
   * Get supported languages for transcription
   */
  static getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'auto', name: 'Auto-detect' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'nl', name: 'Dutch' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'fi', name: 'Finnish' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' }
    ];
  }

  /**
   * Get available AI models
   */
  static getAvailableModels(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        description: 'Fast and cost-effective for most tasks'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        description: 'Most capable model for complex analysis'
      }
    ];
  }

  /**
   * Validate processing options
   */
  static validateProcessingOptions(
    jobType: 'transcription' | 'summary' | 'analysis',
    options: StartProcessingRequest['options'] = {}
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (jobType === 'transcription') {
      if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 1)) {
        errors.push('Temperature must be between 0 and 1');
      }
    }

    if (jobType === 'summary' || jobType === 'analysis') {
      if (options.maxTokens !== undefined && (options.maxTokens < 1 || options.maxTokens > 4000)) {
        errors.push('Max tokens must be between 1 and 4000');
      }
      
      if (options.temperature !== undefined && (options.temperature < 0 || options.temperature > 2)) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format processing time
   */
  static formatProcessingTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Export processing result
   */
  static exportResult(
    result: JobResult['result'],
    format: 'txt' | 'json' | 'srt' | 'csv' = 'txt'
  ): { content: string; filename: string; mimeType: string } {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    switch (format) {
      case 'json':
        return {
          content: JSON.stringify(result, null, 2),
          filename: `audio-processing-${timestamp}.json`,
          mimeType: 'application/json'
        };
        
      case 'srt':
        if (result?.segments) {
          const srtContent = result.segments
            .map((segment, index) => {
              const start = this.formatSrtTime(segment.start);
              const end = this.formatSrtTime(segment.end);
              return `${index + 1}\n${start} --> ${end}\n${segment.text}\n`;
            })
            .join('\n');
            
          return {
            content: srtContent,
            filename: `subtitles-${timestamp}.srt`,
            mimeType: 'text/plain'
          };
        }
        // Fall through to txt if no segments
        
      case 'txt':
      default:
        const content = [
          result?.transcript && `TRANSCRIPT:\n${result.transcript}`,
          result?.summary && `\nSUMMARY:\n${result.summary}`,
          result?.keyPoints && `\nKEY POINTS:\n${result.keyPoints.map(p => `• ${p}`).join('\n')}`,
          result?.topics && `\nTOPICS:\n${result.topics.join(', ')}`,
          result?.sentiment && `\nSENTIMENT: ${result.sentiment}`
        ].filter(Boolean).join('\n');
        
        return {
          content,
          filename: `audio-processing-${timestamp}.txt`,
          mimeType: 'text/plain'
        };
    }
  }

  /**
   * Format time for SRT files
   */
  private static formatSrtTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
  }
}

export default ProcessingService;