/**
 * Multipart Upload Manager
 * Handles AWS S3 multipart upload operations
 */

import { 
  CreateMultipartUploadCommand, 
  UploadPartCommand, 
  CompleteMultipartUploadCommand, 
  AbortMultipartUploadCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageService } from '../storage.service';
import { logger } from '../../../utils/logger';

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

export class MultipartUploadManager {
  private storageService: StorageService;
  private activeUploads: Map<string, MultipartUpload> = new Map();

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  async initializeMultipartUpload(uploadId: string, key: string): Promise<string> {
    try {
      const s3Client = this.storageService.getS3Client();
      const bucket = this.storageService.getBucket();

      const command = new CreateMultipartUploadCommand({
        Bucket: bucket,
        Key: key,
        ContentType: 'audio/*'
      });

      const response = await s3Client.send(command);
      const multipartUploadId = response.UploadId!;

      this.activeUploads.set(uploadId, {
        uploadId: multipartUploadId,
        key,
        parts: []
      });

      logger.info(`Multipart upload initialized: ${uploadId}`);
      return multipartUploadId;
    } catch (error) {
      logger.error(`Failed to initialize multipart upload: ${error}`);
      throw error;
    }
  }

  async uploadChunk(
    uploadId: string, 
    partNumber: number, 
    chunk: Buffer
  ): Promise<ChunkUploadResult> {
    try {
      const upload = this.activeUploads.get(uploadId);
      if (!upload) {
        throw new Error(`Upload not found: ${uploadId}`);
      }

      const s3Client = this.storageService.getS3Client();
      const bucket = this.storageService.getBucket();

      const command = new UploadPartCommand({
        Bucket: bucket,
        Key: upload.key,
        PartNumber: partNumber,
        UploadId: upload.uploadId,
        Body: chunk
      });

      const response = await s3Client.send(command);
      const etag = response.ETag!;

      upload.parts.push({ partNumber, etag });
      upload.parts.sort((a, b) => a.partNumber - b.partNumber);

      return {
        partNumber,
        etag,
        size: chunk.length
      };
    } catch (error) {
      logger.error(`Failed to upload chunk ${partNumber}: ${error}`);
      throw error;
    }
  }

  async completeMultipartUpload(uploadId: string): Promise<string> {
    try {
      const upload = this.activeUploads.get(uploadId);
      if (!upload) {
        throw new Error(`Upload not found: ${uploadId}`);
      }

      const s3Client = this.storageService.getS3Client();
      const bucket = this.storageService.getBucket();

      const command = new CompleteMultipartUploadCommand({
        Bucket: bucket,
        Key: upload.key,
        UploadId: upload.uploadId,
        MultipartUpload: {
          Parts: upload.parts.map(part => ({
            ETag: part.etag,
            PartNumber: part.partNumber
          }))
        }
      });

      const response = await s3Client.send(command);
      this.activeUploads.delete(uploadId);

      logger.info(`Multipart upload completed: ${uploadId}`);
      return response.Location!;
    } catch (error) {
      logger.error(`Failed to complete multipart upload: ${error}`);
      throw error;
    }
  }

  async abortMultipartUpload(uploadId: string): Promise<void> {
    try {
      const upload = this.activeUploads.get(uploadId);
      if (!upload) {
        return; // Already cleaned up
      }

      const s3Client = this.storageService.getS3Client();
      const bucket = this.storageService.getBucket();

      const command = new AbortMultipartUploadCommand({
        Bucket: bucket,
        Key: upload.key,
        UploadId: upload.uploadId
      });

      await s3Client.send(command);
      this.activeUploads.delete(uploadId);

      logger.info(`Multipart upload aborted: ${uploadId}`);
    } catch (error) {
      logger.error(`Failed to abort multipart upload: ${error}`);
      throw error;
    }
  }

  getUploadProgress(uploadId: string): number {
    const upload = this.activeUploads.get(uploadId);
    return upload ? upload.parts.length : 0;
  }

  async getSignedUrls(uploadId: string, partCount: number): Promise<string[]> {
    try {
      const upload = this.activeUploads.get(uploadId);
      if (!upload) {
        throw new Error(`Upload not found: ${uploadId}`);
      }

      const s3Client = this.storageService.getS3Client();
      const bucket = this.storageService.getBucket();
      const urls: string[] = [];

      for (let i = 0; i < partCount; i++) {
        const command = new UploadPartCommand({
          Bucket: bucket,
          Key: upload.key,
          UploadId: upload.uploadId,
          PartNumber: i + 1
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        urls.push(url);
      }

      return urls;
    } catch (error) {
      logger.error(`Failed to generate signed URLs: ${error}`);
      throw error;
    }
  }
}