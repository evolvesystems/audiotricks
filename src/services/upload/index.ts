/**
 * Upload service - Main entry point
 * Refactored into focused modules for CLAUDE.md compliance
 */

import { FileUploader } from './file-uploader';
import { UploadManager } from './upload-manager';

export * from './types';
export * from './file-uploader';
export * from './upload-manager';

/**
 * Main upload service class that combines all functionality
 */
export class UploadService {
  public readonly files: FileUploader;
  public readonly manage: UploadManager;

  constructor() {
    this.files = new FileUploader();
    this.manage = new UploadManager();
  }

  // Convenience methods for common operations
  
  /**
   * Quick file upload with default settings
   */
  async uploadFile(file: File, workspaceId: string, onProgress?: (progress: number) => void) {
    return this.files.uploadFile(file, workspaceId, {
      onProgress: (progress) => {
        onProgress?.(progress.progress);
      }
    });
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[], 
    workspaceId: string, 
    options: {
      onFileProgress?: (fileIndex: number, progress: number) => void;
      onOverallProgress?: (completedFiles: number, totalFiles: number) => void;
      concurrency?: number;
    } = {}
  ): Promise<string[]> {
    const { onFileProgress, onOverallProgress, concurrency = 3 } = options;
    const uploadPromises: Promise<string>[] = [];
    const results: string[] = [];
    let completedCount = 0;

    // Create upload promises
    files.forEach((file, index) => {
      const uploadPromise = this.files.uploadFile(file, workspaceId, {
        onProgress: (progress) => {
          onFileProgress?.(index, progress.progress);
        },
        onComplete: () => {
          completedCount++;
          onOverallProgress?.(completedCount, files.length);
        }
      });
      uploadPromises.push(uploadPromise);
    });

    // Execute with concurrency limit
    for (let i = 0; i < uploadPromises.length; i += concurrency) {
      const batch = uploadPromises.slice(i, i + concurrency);
      const batchResults = await Promise.allSettled(batch);
      
      batchResults.forEach((result, batchIndex) => {
        if (result.status === 'fulfilled') {
          results[i + batchIndex] = result.value;
        } else {
          throw new Error(`Upload failed for file ${i + batchIndex}: ${result.reason}`);
        }
      });
    }

    return results;
  }

  /**
   * Validate file before upload (convenience method)
   */
  async validateFile(file: File) {
    return this.manage.validateFile(file);
  }

  /**
   * Get upload details (convenience method)
   */
  async getUpload(uploadId: string) {
    return this.manage.getUpload(uploadId);
  }

  /**
   * Cancel upload (convenience method)
   */
  cancelUpload(uploadId: string) {
    this.files.cancelUpload(uploadId);
  }
}

// Export singleton instance
export const uploadService = new UploadService();