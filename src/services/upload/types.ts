/**
 * Upload service type definitions
 */

export interface InitializeUploadRequest {
  filename: string;
  fileSize: number;
  mimeType: string;
  workspaceId: string;
}

export interface InitializeUploadResponse {
  uploadId: string;
  multipart: boolean;
  uploadUrls?: string[];
  chunkSize?: number;
}

export interface UploadChunkResponse {
  success: boolean;
  chunk: {
    partNumber: number;
    etag: string;
    size: number;
  };
  progress: number;
}

export interface UploadListParams {
  workspaceId?: string;
  status?: 'pending' | 'uploading' | 'completed' | 'failed';
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'filename' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface UploadProgress {
  uploadId: string;
  progress: number;
  uploadedBytes: number;
  totalBytes: number;
  chunksCompleted: number;
  totalChunks: number;
  status: 'uploading' | 'completed' | 'failed';
  error?: string;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (uploadId: string) => void;
  chunkSize?: number;
  maxRetries?: number;
  timeout?: number;
}

export interface UploadStats {
  totalUploads: number;
  completedUploads: number;
  failedUploads: number;
  totalBytes: number;
  averageUploadSpeed: number; // bytes per second
}

export interface FileValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
  metadata?: {
    duration?: number;
    format?: string;
    bitrate?: number;
    sampleRate?: number;
    channels?: number;
  };
}