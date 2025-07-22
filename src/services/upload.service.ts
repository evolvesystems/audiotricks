import { apiClient, ApiError, Upload, PaginatedResponse } from './api';
import { logger } from '../utils/logger';

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
  limit?: number;
  offset?: number;
}

export interface ChunkUploadProgress {
  chunkIndex: number;
  totalChunks: number;
  chunkProgress: number;
  overallProgress: number;
}

export class UploadService {
  /**
   * Initialize a file upload
   */
  static async initializeUpload(request: InitializeUploadRequest): Promise<InitializeUploadResponse> {
    try {
      return await apiClient.post<InitializeUploadResponse>('/upload/initialize', request);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isQuotaError) {
          throw new ApiError(
            429,
            'Storage quota exceeded',
            error.details,
            error.suggestion || 'Delete some files or upgrade your plan'
          );
        }
        if (error.status === 403) {
          throw new ApiError(403, 'Access denied to workspace');
        }
      }
      throw error;
    }
  }

  /**
   * Upload a file (handles both small files and initialization of large files)
   */
  static async uploadFile(
    file: File,
    workspaceId: string,
    options?: {
      onProgress?: (progress: ChunkUploadProgress) => void
    }
  ): Promise<Upload> {
    try {
      // First validate the file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new ApiError(400, validation.error || 'File validation failed');
      }

      // Initialize upload
      const initResponse = await this.initializeUpload({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        workspaceId
      });

      let upload: Upload;

      if (initResponse.multipart) {
        // Handle large file with chunking
        upload = await this.uploadLargeFile(
          initResponse.uploadId,
          file,
          initResponse.chunkSize || 10 * 1024 * 1024,
          options?.onProgress
        );
      } else {
        // Handle small file directly
        const formData = new FormData();
        formData.append('file', file);
        formData.append('uploadId', initResponse.uploadId);

        const response = await apiClient.uploadFile<{ success: boolean; upload: any }>(
          '/upload',
          formData,
          (progress) => {
            if (options?.onProgress) {
              options.onProgress({
                chunkIndex: 0,
                totalChunks: 1,
                chunkProgress: progress,
                overallProgress: progress
              });
            }
          }
        );

        if (!response.success) {
          throw new ApiError(500, 'Upload failed');
        }

        // Convert response to Upload type
        upload = {
          id: response.upload.id,
          originalFileName: response.upload.filename,
          fileSize: response.upload.fileSize.toString(),
          uploadStatus: response.upload.status,
          uploadProgress: 100,
          storageUrl: response.upload.storageUrl,
          cdnUrl: response.upload.cdnUrl,
          createdAt: response.upload.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      return upload;
    } catch (error) {
      if (error instanceof ApiError && error.isQuotaError) {
        throw new ApiError(
          429,
          'Storage quota exceeded during upload',
          error.details,
          'Delete some files or upgrade your plan'
        );
      }
      throw error;
    }
  }

  /**
   * Upload a file chunk (for multipart uploads)
   */
  static async uploadChunk(
    uploadId: string,
    file: File,
    chunkIndex: number,
    totalChunks: number,
    onProgress?: (progress: ChunkUploadProgress) => void
  ): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uploadId', uploadId);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());

    return apiClient.uploadFile<UploadChunkResponse>(
      '/upload/chunk',
      formData,
      (chunkProgress) => {
        if (onProgress) {
          const overallProgress = ((chunkIndex / totalChunks) * 100) + 
                                 ((chunkProgress / totalChunks));
          onProgress({
            chunkIndex,
            totalChunks,
            chunkProgress,
            overallProgress
          });
        }
      }
    );
  }

  /**
   * Upload large file with chunking
   */
  static async uploadLargeFile(
    uploadId: string,
    file: File,
    chunkSize: number = 10 * 1024 * 1024, // 10MB default
    onProgress?: (progress: ChunkUploadProgress) => void
  ): Promise<Upload> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadedChunks: UploadChunkResponse[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      try {
        const result = await this.uploadChunk(
          uploadId,
          new File([chunk], file.name, { type: file.type }),
          i,
          totalChunks,
          onProgress
        );

        uploadedChunks.push(result);

        // Final chunk completes the upload
        if (i === totalChunks - 1) {
          // Get the final upload status
          const uploadStatus = await this.getUploadStatus(uploadId);
          
          // Convert to Upload format
          return {
            id: uploadStatus.id,
            originalFileName: uploadStatus.filename,
            fileSize: uploadStatus.fileSize.toString(),
            uploadStatus: uploadStatus.status,
            uploadProgress: 100,
            storageUrl: uploadStatus.storageUrl,
            cdnUrl: uploadStatus.cdnUrl,
            createdAt: uploadStatus.uploadedAt || uploadStatus.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      } catch (error) {
        // Cancel upload on error
        try {
          await this.cancelUpload(uploadId);
        } catch (cancelError) {
          console.warn('Failed to cancel upload:', cancelError);
        }
        throw error;
      }
    }

    throw new ApiError(500, 'Upload completed but status unknown');
  }

  /**
   * Get upload status
   */
  static async getUploadStatus(uploadId: string): Promise<Upload & {
    chunks?: Array<{
      index: number;
      size: string;
      uploaded: boolean;
    }>;
    processingJobs?: Array<{
      id: string;
      type: string;
      status: string;
      progress: number;
    }>;
  }> {
    return apiClient.get(`/upload/${uploadId}/status`);
  }

  /**
   * Cancel an upload
   */
  static async cancelUpload(uploadId: string): Promise<void> {
    await apiClient.delete(`/upload/${uploadId}`);
  }

  /**
   * List uploads
   */
  static async listUploads(params: UploadListParams = {}): Promise<PaginatedResponse<Upload>> {
    return apiClient.get('/upload', params);
  }

  /**
   * Delete an upload
   */
  static async deleteUpload(uploadId: string): Promise<void> {
    await apiClient.delete(`/upload/${uploadId}`);
  }

  /**
   * Retry a failed upload
   */
  static async retryUpload(uploadId: string): Promise<InitializeUploadResponse> {
    return apiClient.post(`/upload/${uploadId}/retry`);
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/aac',
      'audio/ogg',
      'audio/webm',
      'audio/flac',
      'audio/x-flac',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 500MB limit'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}. Please use audio or video files.`
      };
    }

    return { valid: true };
  }

  /**
   * Estimate processing time based on file size
   */
  static estimateProcessingTime(fileSize: number): number {
    // Rough estimate: 1 minute per 10MB
    return Math.ceil(fileSize / (10 * 1024 * 1024));
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    return `${size.toFixed(1)} ${sizes[i]}`;
  }

  /**
   * Get supported file extensions
   */
  static getSupportedExtensions(): string[] {
    return [
      '.mp3', '.wav', '.mp4', '.aac', '.ogg', 
      '.webm', '.flac', '.m4a', '.mov'
    ];
  }
}

export default UploadService;