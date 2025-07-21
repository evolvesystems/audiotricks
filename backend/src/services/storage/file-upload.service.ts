import { CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { StorageService } from './storage.service';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { getErrorMessage } from '../../utils/error-handler';
import crypto from 'crypto';

interface MultipartUpload {
  uploadId: string;
  key: string;
  parts: Array<{
    partNumber: number;
    etag: string;
  }>;
}

interface ChunkUploadResult {
  partNumber: number;
  etag: string;
  size: number;
}

export class FileUploadService {
  private prisma: PrismaClient;
  private storageService: StorageService;
  private activeUploads: Map<string, MultipartUpload> = new Map();

  constructor(storageService: StorageService) {
    this.prisma = new PrismaClient();
    this.storageService = storageService;
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
        const uploadId = await this.initializeMultipartUpload(storageKey, mimeType);
        
        this.activeUploads.set(upload.id, {
          uploadId,
          key: storageKey,
          parts: []
        });

        logger.info('Initialized multipart upload', {
          uploadId: upload.id,
          fileSize,
          storageKey
        });
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
  async uploadSingleFile(
    uploadId: string,
    fileBuffer: Buffer
  ): Promise<void> {
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
      await this.prisma.fileStorage.create({
        data: {
          uploadId,
          providerId: await this.getStorageProviderId(),
          storageKey: upload.storagePath,
          fileName: upload.originalFileName,
          fileSize: upload.fileSize,
          mimeType: upload.mimeType,
          checksum: this.calculateChecksum(fileBuffer),
          cdnUrl: result.cdnUrl,
          metadata: {
            uploadedAt: new Date().toISOString()
          }
        }
      });

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
  ): Promise<ChunkUploadResult> {
    try {
      const multipartUpload = this.activeUploads.get(uploadId);
      if (!multipartUpload) {
        throw new Error('Multipart upload not initialized');
      }

      const upload = await this.prisma.audioUpload.findUnique({
        where: { id: uploadId }
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      // Upload chunk to S3
      const partNumber = chunkIndex + 1;
      const etag = await this.uploadPart(
        multipartUpload.key,
        multipartUpload.uploadId,
        chunkData,
        partNumber
      );

      // Store chunk info
      multipartUpload.parts.push({ partNumber, etag });

      // Create chunk record
      await this.prisma.audioChunk.create({
        data: {
          uploadId,
          chunkIndex,
          startByte: BigInt(chunkIndex * 10 * 1024 * 1024), // 10MB chunks
          endByte: BigInt((chunkIndex + 1) * 10 * 1024 * 1024),
          size: BigInt(chunkData.length),
          storageKey: `${multipartUpload.key}-part${partNumber}`,
          checksum: this.calculateChecksum(chunkData),
          uploadedAt: new Date()
        }
      });

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

      return {
        partNumber,
        etag,
        size: chunkData.length
      };
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
      const multipartUpload = this.activeUploads.get(uploadId);
      if (!multipartUpload) {
        throw new Error('Multipart upload not found');
      }

      const upload = await this.prisma.audioUpload.findUnique({
        where: { id: uploadId }
      });

      if (!upload) {
        throw new Error('Upload not found');
      }

      // Complete S3 multipart upload
      const command = new CompleteMultipartUploadCommand({
        Bucket: config.storage.digitalOcean.bucket,
        Key: multipartUpload.key,
        UploadId: multipartUpload.uploadId,
        MultipartUpload: {
          Parts: multipartUpload.parts.sort((a, b) => a.partNumber - b.partNumber).map(part => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
        }
      });

      await this.storageService['s3Client'].send(command);

      // Get file URL
      const url = await this.storageService.getFileUrl(multipartUpload.key);
      const cdnUrl = this.storageService.getCdnUrl(multipartUpload.key);

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

      // Create file storage record
      await this.prisma.fileStorage.create({
        data: {
          uploadId,
          providerId: await this.getStorageProviderId(),
          storageKey: multipartUpload.key,
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

      // Clean up
      this.activeUploads.delete(uploadId);

      logger.info('Multipart upload completed', { uploadId });
    } catch (error) {
      await this.markUploadFailed(uploadId, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Initialize a multipart upload on S3
   */
  private async initializeMultipartUpload(key: string, contentType: string): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: config.storage.digitalOcean.bucket,
      Key: key,
      ContentType: contentType
    });

    const response = await this.storageService['s3Client'].send(command);
    return response.UploadId!;
  }

  /**
   * Upload a single part of a multipart upload
   */
  private async uploadPart(
    key: string,
    uploadId: string,
    body: Buffer,
    partNumber: number
  ): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: config.storage.digitalOcean.bucket,
      Key: key,
      UploadId: uploadId,
      Body: body,
      PartNumber: partNumber
    });

    const response = await this.storageService['s3Client'].send(command);
    return response.ETag!;
  }

  /**
   * Cancel an upload
   */
  async cancelUpload(uploadId: string): Promise<void> {
    try {
      const multipartUpload = this.activeUploads.get(uploadId);
      
      if (multipartUpload) {
        // Abort S3 multipart upload
        const command = new AbortMultipartUploadCommand({
          Bucket: config.storage.digitalOcean.bucket,
          Key: multipartUpload.key,
          UploadId: multipartUpload.uploadId
        });

        await this.storageService['s3Client'].send(command);
        this.activeUploads.delete(uploadId);
      }

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
  async generateUploadUrls(
    uploadId: string,
    partCount: number
  ): Promise<string[]> {
    const multipartUpload = this.activeUploads.get(uploadId);
    if (!multipartUpload) {
      throw new Error('Multipart upload not initialized');
    }

    const urls: string[] = [];

    for (let i = 0; i < partCount; i++) {
      const command = new UploadPartCommand({
        Bucket: config.storage.digitalOcean.bucket,
        Key: multipartUpload.key,
        UploadId: multipartUpload.uploadId,
        PartNumber: i + 1
      });

      const url = await getSignedUrl(
        this.storageService['s3Client'],
        command,
        { expiresIn: 3600 } // 1 hour
      );

      urls.push(url);
    }

    return urls;
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
          endpoint: config.storage.digitalOcean.endpoint,
          region: config.storage.digitalOcean.region,
          bucket: config.storage.digitalOcean.bucket,
          cdnEndpoint: config.storage.digitalOcean.cdnEndpoint,
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