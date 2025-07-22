/**
 * Upload management functionality
 */

import { apiClient, Upload, PaginatedResponse } from '../api';
import { logger } from '../../utils/logger';
import { UploadListParams, UploadStats, FileValidationResult } from './types';

export class UploadManager {
  /**
   * List uploads with pagination and filtering
   */
  async listUploads(params: UploadListParams = {}): Promise<PaginatedResponse<Upload>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.workspaceId) queryParams.append('workspaceId', params.workspaceId);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get<PaginatedResponse<Upload>>(
        `/upload?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      logger.error('Failed to list uploads:', error);
      throw new Error(`Failed to list uploads: ${error}`);
    }
  }

  /**
   * Get upload details
   */
  async getUpload(uploadId: string): Promise<Upload> {
    try {
      const response = await apiClient.get<Upload>(`/upload/${uploadId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get upload:', error);
      throw new Error(`Failed to get upload: ${error}`);
    }
  }

  /**
   * Delete an upload
   */
  async deleteUpload(uploadId: string): Promise<void> {
    try {
      await apiClient.delete(`/upload/${uploadId}`);
    } catch (error) {
      logger.error('Failed to delete upload:', error);
      throw new Error(`Failed to delete upload: ${error}`);
    }
  }

  /**
   * Bulk delete uploads
   */
  async deleteUploads(uploadIds: string[]): Promise<{ succeeded: string[]; failed: string[] }> {
    try {
      const response = await apiClient.post('/upload/bulk-delete', { uploadIds });
      return response.data;
    } catch (error) {
      logger.error('Failed to bulk delete uploads:', error);
      throw new Error(`Failed to bulk delete uploads: ${error}`);
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(workspaceId?: string): Promise<UploadStats> {
    try {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : '';
      const response = await apiClient.get<UploadStats>(`/upload/stats${params}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get upload stats:', error);
      throw new Error(`Failed to get upload stats: ${error}`);
    }
  }

  /**
   * Validate file before upload
   */
  async validateFile(file: File): Promise<FileValidationResult> {
    try {
      // Client-side validation
      const errors: string[] = [];
      const warnings: string[] = [];

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (100MB)`);
      }

      // Check file type
      const allowedTypes = [
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a', 
        'audio/aac', 'audio/ogg', 'audio/flac', 'audio/webm',
        'video/mp4', 'video/quicktime', 'video/avi'
      ];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|aac|ogg|flac|mp4|mov|avi)$/i)) {
        errors.push(`Unsupported file type: ${file.type || 'unknown'}`);
      }

      // Check file name
      if (file.name.length > 255) {
        errors.push('File name too long (max 255 characters)');
      }

      if (file.name.match(/[<>:"/\\|?*]/)) {
        errors.push('File name contains invalid characters');
      }

      // Warnings for large files
      if (file.size > 50 * 1024 * 1024) { // 50MB
        warnings.push('Large file may take longer to process');
      }

      const result: FileValidationResult = {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

      // Try to get metadata if it's an audio/video file
      if (result.valid && file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        try {
          result.metadata = await this.extractFileMetadata(file);
        } catch (error) {
          logger.warn('Failed to extract file metadata:', error);
        }
      }

      return result;
    } catch (error) {
      logger.error('File validation failed:', error);
      return {
        valid: false,
        errors: ['File validation failed']
      };
    }
  }

  /**
   * Extract metadata from audio/video file
   */
  private async extractFileMetadata(file: File): Promise<FileValidationResult['metadata']> {
    return new Promise((resolve, reject) => {
      const audio = document.createElement('audio');
      const video = document.createElement('video');
      const element = file.type.startsWith('video/') ? video : audio;
      
      element.preload = 'metadata';
      element.onloadedmetadata = () => {
        const metadata = {
          duration: element.duration,
          format: file.type
        };
        
        // Clean up
        URL.revokeObjectURL(element.src);
        resolve(metadata);
      };
      
      element.onerror = () => {
        URL.revokeObjectURL(element.src);
        reject(new Error('Failed to load metadata'));
      };
      
      element.src = URL.createObjectURL(file);
    });
  }

  /**
   * Resume a failed upload
   */
  async resumeUpload(uploadId: string): Promise<void> {
    try {
      await apiClient.post(`/upload/${uploadId}/resume`);
    } catch (error) {
      logger.error('Failed to resume upload:', error);
      throw new Error(`Failed to resume upload: ${error}`);
    }
  }

  /**
   * Get supported file formats
   */
  getSupportedFormats(): Array<{ extension: string; mimeType: string; description: string }> {
    return [
      { extension: '.mp3', mimeType: 'audio/mpeg', description: 'MP3 Audio' },
      { extension: '.wav', mimeType: 'audio/wav', description: 'WAV Audio' },
      { extension: '.m4a', mimeType: 'audio/m4a', description: 'M4A Audio' },
      { extension: '.aac', mimeType: 'audio/aac', description: 'AAC Audio' },
      { extension: '.ogg', mimeType: 'audio/ogg', description: 'OGG Audio' },
      { extension: '.flac', mimeType: 'audio/flac', description: 'FLAC Audio' },
      { extension: '.webm', mimeType: 'audio/webm', description: 'WebM Audio' },
      { extension: '.mp4', mimeType: 'video/mp4', description: 'MP4 Video' },
      { extension: '.mov', mimeType: 'video/quicktime', description: 'QuickTime Video' },
      { extension: '.avi', mimeType: 'video/avi', description: 'AVI Video' }
    ];
  }
}