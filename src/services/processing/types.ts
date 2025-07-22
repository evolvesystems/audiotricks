/**
 * Processing service type definitions
 */

export interface ProcessAudioRequest {
  audioUploadId: string;
  workspaceId: string;
  operations: string[];
  config?: {
    language?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
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
    
    // Analysis result
    entities?: Array<{
      name: string;
      type: string;
      confidence: number;
    }>;
    keywords?: string[];
    categories?: string[];
    
    // Export formats
    formats?: {
      text?: string;
      json?: any;
      srt?: string;
      vtt?: string;
    };
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobListParams {
  workspaceId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface ProcessingStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
  queuedJobs: number;
  averageProcessingTime: number;
}

export interface JobStatusUpdate {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
}