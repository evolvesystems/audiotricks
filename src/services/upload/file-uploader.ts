/**
 * File upload functionality
 */

import { apiClient } from '../api';
import { logger } from '../../utils/logger';
import { 
  InitializeUploadRequest, 
  InitializeUploadResponse, 
  UploadChunkResponse, 
  UploadProgress,
  UploadOptions
} from './types';

export class FileUploader {
  private activeUploads = new Map<string, AbortController>();

  /**
   * Initialize a new upload
   */
  async initializeUpload(request: InitializeUploadRequest): Promise<InitializeUploadResponse> {
    try {
      const response = await apiClient.post<InitializeUploadResponse>('/upload/initialize', request);
      return response.data;
    } catch (error) {
      logger.error('Failed to initialize upload:', error);
      throw new Error(`Failed to initialize upload: ${error}`);
    }
  }

  /**
   * Upload a file with support for multipart uploads
   */
  async uploadFile(
    file: File, 
    workspaceId: string, 
    options: UploadOptions = {}
  ): Promise<string> {
    const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const abortController = new AbortController();
    this.activeUploads.set(uploadId, abortController);

    try {
      // Initialize upload
      const initResponse = await this.initializeUpload({
        filename: file.name,
        fileSize: file.size,
        mimeType: file.type,
        workspaceId
      });

      const actualUploadId = initResponse.uploadId;
      
      if (initResponse.multipart) {
        return await this.multipartUpload(file, actualUploadId, initResponse, options, abortController);
      } else {
        return await this.singleUpload(file, actualUploadId, options, abortController);
      }
    } catch (error) {
      logger.error('Upload failed:', error);
      options.onError?.(error as Error);
      throw error;
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Single file upload
   */
  private async singleUpload(
    file: File,
    uploadId: string,
    options: UploadOptions,
    abortController: AbortController
  ): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadId', uploadId);

      const response = await apiClient.post(`/upload/${uploadId}`, formData, {
        signal: abortController.signal,
        timeout: options.timeout || 300000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress: UploadProgress = {
              uploadId,
              progress: Math.round((progressEvent.loaded / progressEvent.total) * 100),
              uploadedBytes: progressEvent.loaded,
              totalBytes: progressEvent.total,
              chunksCompleted: 1,
              totalChunks: 1,
              status: 'uploading'
            };
            options.onProgress?.(progress);
          }
        }
      });

      options.onComplete?.(uploadId);
      return response.data.uploadId;
    } catch (error) {
      logger.error('Single upload failed:', error);
      throw new Error(`Single upload failed: ${error}`);
    }
  }

  /**
   * Multipart file upload
   */
  private async multipartUpload(
    file: File,
    uploadId: string,
    initResponse: InitializeUploadResponse,
    options: UploadOptions,
    abortController: AbortController
  ): Promise<string> {
    const chunkSize = initResponse.chunkSize || 5 * 1024 * 1024; // 5MB default
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadedChunks: UploadChunkResponse['chunk'][] = [];

    try {
      // Upload chunks in parallel (with limit)
      const concurrentUploads = 3;
      const chunks: Promise<void>[] = [];

      for (let i = 0; i < totalChunks; i++) {
        const chunkPromise = this.uploadChunk(
          file,
          uploadId,
          i,
          chunkSize,
          options,
          abortController,
          (chunkData) => {
            uploadedChunks[i] = chunkData;
            
            const progress: UploadProgress = {
              uploadId,
              progress: Math.round((uploadedChunks.filter(c => c).length / totalChunks) * 100),
              uploadedBytes: uploadedChunks.reduce((sum, chunk) => sum + (chunk?.size || 0), 0),
              totalBytes: file.size,
              chunksCompleted: uploadedChunks.filter(c => c).length,
              totalChunks,
              status: 'uploading'
            };
            options.onProgress?.(progress);
          }
        );

        chunks.push(chunkPromise);

        // Limit concurrent uploads
        if (chunks.length >= concurrentUploads) {
          await Promise.all(chunks.splice(0, concurrentUploads));
        }
      }

      // Wait for remaining chunks
      if (chunks.length > 0) {
        await Promise.all(chunks);
      }

      // Complete multipart upload
      await this.completeMultipartUpload(uploadId, uploadedChunks);
      
      options.onComplete?.(uploadId);
      return uploadId;
    } catch (error) {
      logger.error('Multipart upload failed:', error);
      await this.abortMultipartUpload(uploadId);
      throw new Error(`Multipart upload failed: ${error}`);
    }
  }

  /**
   * Upload a single chunk
   */
  private async uploadChunk(
    file: File,
    uploadId: string,
    chunkIndex: number,
    chunkSize: number,
    options: UploadOptions,
    abortController: AbortController,
    onChunkComplete: (chunk: UploadChunkResponse['chunk']) => void
  ): Promise<void> {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    let retries = 0;
    const maxRetries = options.maxRetries || 3;

    while (retries <= maxRetries) {
      try {
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('chunkIndex', chunkIndex.toString());

        const response = await apiClient.post<UploadChunkResponse>(
          `/upload/${uploadId}/chunk`,
          formData,
          {
            signal: abortController.signal,
            timeout: options.timeout || 60000
          }
        );

        onChunkComplete(response.data.chunk);
        return;
      } catch (error) {
        retries++;
        logger.warn(`Chunk ${chunkIndex} upload failed, retry ${retries}/${maxRetries}:`, error);
        
        if (retries > maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
      }
    }
  }

  /**
   * Complete multipart upload
   */
  private async completeMultipartUpload(
    uploadId: string,
    chunks: UploadChunkResponse['chunk'][]
  ): Promise<void> {
    try {
      await apiClient.post(`/upload/${uploadId}/complete`, { chunks });
    } catch (error) {
      logger.error('Failed to complete multipart upload:', error);
      throw new Error(`Failed to complete multipart upload: ${error}`);
    }
  }

  /**
   * Abort multipart upload
   */
  private async abortMultipartUpload(uploadId: string): Promise<void> {
    try {
      await apiClient.delete(`/upload/${uploadId}`);
    } catch (error) {
      logger.warn('Failed to abort multipart upload:', error);
    }
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(uploadId: string): void {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(uploadId);
    }
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads(): void {
    for (const [uploadId, controller] of this.activeUploads) {
      controller.abort();
    }
    this.activeUploads.clear();
  }
}