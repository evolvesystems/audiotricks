/**
 * File Upload Service
 * Handles file uploads with validation and multipart support
 */

import { PrismaClient } from '@prisma/client';
import { StorageService } from './storage.service';
import { MultipartUploadManager } from './upload/MultipartUploadManager';
import { UploadValidator } from './upload/UploadValidator';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';
import crypto from 'crypto';

export class FileUploadService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private uploadManager: MultipartUploadManager;
  private validator: UploadValidator;

  constructor(storageService: StorageService) {
    this.prisma = new PrismaClient();
    this.storageService = storageService;
    this.uploadManager = new MultipartUploadManager(storageService);
    this.validator = new UploadValidator();
  }

  /**
   * Initialize a new file upload
   */
  async initializeUpload(
    userId: string,
    workspaceId: string,
    filename: string,
    fileSize: number,
    mimeType: string
  ): Promise<string> {
    try {
      // Validate upload
      const validation = await this.validator.validateUpload(
        userId,
        workspaceId,
        filename,
        fileSize,
        mimeType
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Create upload record in database
      const upload = await this.prisma.audioUpload.create({
        data: {
          userId,
          workspaceId,
          originalFileName: filename,
          fileSize: BigInt(fileSize),
          mimeType,
          uploadStatus: 'pending',
          storageProvider: 'digitalocean'
        }
      });

      // Generate storage key
      const storageKey = this.storageService.generateFileKey(
        workspaceId,
        userId,
        filename
      );

      // For large files, initialize multipart upload
      if (fileSize > 100 * 1024 * 1024) { // 100MB
        await this.uploadManager.initializeMultipartUpload(upload.id, storageKey);
        logger.info('Initialized multipart upload', { uploadId: upload.id, fileSize });
      }

      // Update upload record with storage path
      await this.prisma.audioUpload.update({
        where: { id: upload.id },
        data: {
          storagePath: storageKey,
          uploadStatus: 'uploading'
        }
      });

      return upload.id;
    } catch (error) {
      logger.error('Failed to initialize upload', { error });
      throw new Error(`Failed to initialize upload: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Upload a single file (for small files)
   */
  async uploadSingleFile(uploadId: string, fileBuffer: Buffer): Promise<void> {
    try {
      const upload = await this.prisma.audioUpload.findUnique({
        where: { id: uploadId }
      });

      if (!upload || !upload.storagePath) {
        throw new Error('Upload not found or not initialized');
      }

      // Upload to storage
      const result = await this.storageService.uploadFile(
        upload.storagePath,
        fileBuffer,
        {
          contentType: upload.mimeType,
          metadata: {
            uploadId,
            originalFileName: upload.originalFileName
          }
        }
      );

      // Update upload record
      await this.prisma.audioUpload.update({
        where: { id: uploadId },
        data: {
          uploadStatus: 'completed',
          uploadProgress: 100,
          storageUrl: result.url,
          cdnUrl: result.cdnUrl
        }
      });

      // Create file storage record
      await this.createFileStorageRecord(uploadId, upload, fileBuffer);
      logger.info('Single file upload completed', { uploadId });
    } catch (error) {
      await this.markUploadFailed(uploadId, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Upload a file chunk (for multipart uploads)
   */
  async uploadChunk(
    uploadId: string,
    chunkData: Buffer,
    chunkIndex: number,
    totalChunks: number
  ): Promise<{ partNumber: number; etag: string; size: number }> {
    try {
      const upload = await this.prisma.audioUpload.findUnique({
        where: { id: uploadId }
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      const partNumber = chunkIndex + 1;
      const result = await this.uploadManager.uploadChunk(uploadId, partNumber, chunkData);

      // Create chunk record
      await this.createChunkRecord(uploadId, chunkIndex, chunkData, partNumber);

      // Update progress
      const progress = (chunkIndex + 1) / totalChunks * 100;
      await this.prisma.audioUpload.update({
        where: { id: uploadId },
        data: { uploadProgress: progress }
      });

      // Complete upload if this was the last chunk
      if (chunkIndex === totalChunks - 1) {
        await this.completeMultipartUpload(uploadId);
      }

      return result;
    } catch (error) {
      logger.error('Failed to upload chunk', { uploadId, chunkIndex, error });
      throw error;
    }
  }

  /**
   * Complete a multipart upload
   */
  private async completeMultipartUpload(uploadId: string): Promise<void> {
    try {
      const upload = await this.prisma.audioUpload.findUnique({
        where: { id: uploadId }
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      const location = await this.uploadManager.completeMultipartUpload(uploadId);

      // Get file URLs
      const url = await this.storageService.getFileUrl(upload.storagePath!);
      const cdnUrl = this.storageService.getCdnUrl(upload.storagePath!);

      // Update upload record
      await this.prisma.audioUpload.update({
        where: { id: uploadId },
        data: {
          uploadStatus: 'completed',
          uploadProgress: 100,
          storageUrl: url,
          cdnUrl
        }
      });

      // Create file storage record for multipart upload
      await this.createMultipartFileStorageRecord(uploadId, upload, cdnUrl);
      logger.info('Multipart upload completed', { uploadId });
    } catch (error) {
      await this.markUploadFailed(uploadId, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Cancel an upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    try {
      await this.uploadManager.abortMultipartUpload(uploadId);

      // Update database
      await this.prisma.audioUpload.update({
        where: { id: uploadId },
        data: {
          uploadStatus: 'failed',
          metadata: {
            cancelledAt: new Date().toISOString(),
            reason: 'User cancelled'
          }
        }
      });

      logger.info('Upload cancelled', { uploadId });
    } catch (error) {
      logger.error('Failed to cancel upload', { uploadId, error });
      throw error;
    }
  }

  /**
   * Generate presigned URLs for direct browser upload
   */
  async generateUploadUrls(uploadId: string, partCount: number): Promise<string[]> {
    try {
      return await this.uploadManager.getSignedUrls(uploadId, partCount);
    } catch (error) {
      logger.error('Failed to generate upload URLs', { uploadId, error });
      throw error;
    }
  }

  /**
   * Get upload progress
   */
  getUploadProgress(uploadId: string): number {
    return this.uploadManager.getUploadProgress(uploadId);
  }

  /**
   * Create file storage record for single file upload
   */
  private async createFileStorageRecord(
    uploadId: string,
    upload: any,
    fileBuffer: Buffer
  ): Promise<void> {
    await this.prisma.fileStorage.create({
      data: {
        uploadId,
        providerId: await this.getStorageProviderId(),
        storageKey: upload.storagePath,
        fileName: upload.originalFileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        checksum: this.calculateChecksum(fileBuffer),
        cdnUrl: upload.cdnUrl,
        metadata: {
          uploadedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Create file storage record for multipart upload
   */
  private async createMultipartFileStorageRecord(
    uploadId: string,
    upload: any,
    cdnUrl: string
  ): Promise<void> {
    await this.prisma.fileStorage.create({
      data: {
        uploadId,
        providerId: await this.getStorageProviderId(),
        storageKey: upload.storagePath,
        fileName: upload.originalFileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        checksum: 'multipart-' + uploadId,
        cdnUrl,
        metadata: {
          uploadedAt: new Date().toISOString(),
          multipart: true
        }
      }
    });
  }

  /**
   * Create chunk record
   */
  private async createChunkRecord(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer,
    partNumber: number
  ): Promise<void> {
    await this.prisma.audioChunk.create({
      data: {
        uploadId,
        chunkIndex,
        startByte: BigInt(chunkIndex * 10 * 1024 * 1024), // 10MB chunks
        endByte: BigInt((chunkIndex + 1) * 10 * 1024 * 1024),
        size: BigInt(chunkData.length),
        storageKey: `chunk-${partNumber}`,
        checksum: this.calculateChecksum(chunkData),
        uploadedAt: new Date()
      }
    });
  }

  /**
   * Mark an upload as failed
   */
  private async markUploadFailed(uploadId: string, error: string): Promise<void> {
    await this.prisma.audioUpload.update({
      where: { id: uploadId },
      data: {
        uploadStatus: 'failed',
        metadata: {
          error,
          failedAt: new Date().toISOString()
        }
      }
    });
  }

  /**
   * Calculate file checksum
   */
  private calculateChecksum(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get or create storage provider ID
   */
  private async getStorageProviderId(): Promise<string> {
    let provider = await this.prisma.storageProvider.findUnique({
      where: { name: 'digitalocean-spaces' }
    });

    if (!provider) {
      provider = await this.prisma.storageProvider.create({
        data: {
          name: 'digitalocean-spaces',
          type: 'digitalocean',
          endpoint: process.env.DO_SPACES_ENDPOINT || '',
          region: process.env.DO_SPACES_REGION || 'nyc3',
          bucket: process.env.DO_SPACES_BUCKET || '',
          cdnEndpoint: process.env.DO_SPACES_CDN_ENDPOINT || '',
          isActive: true,
          isDefault: true,
          config: {
            provider: 'digitalocean',
            features: ['multipart', 'cdn', 'presigned-urls']
          }
        }
      });
    }

    return provider.id;
  }
}