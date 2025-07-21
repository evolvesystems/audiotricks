import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../../utils/logger';
import { config } from '../../config';
import { getErrorMessage, hasErrorName } from '../../utils/error-handler';

export interface StorageFile {
  key: string;
  url: string;
  cdnUrl?: string;
  size: number;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  expiresIn?: number;
}

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private cdnEndpoint?: string;

  constructor() {
    this.bucket = config.storage.digitalOcean.bucket;
    this.cdnEndpoint = config.storage.digitalOcean.cdnEndpoint;

    this.s3Client = new S3Client({
      endpoint: config.storage.digitalOcean.endpoint,
      region: 'us-east-1', // DigitalOcean Spaces requires this
      credentials: {
        accessKeyId: config.storage.digitalOcean.accessKey,
        secretAccessKey: config.storage.digitalOcean.secretKey
      },
      forcePathStyle: false
    });
  }

  /**
   * Upload a file to storage
   */
  async uploadFile(
    key: string,
    body: Buffer | Uint8Array | string,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    try {
      const metadata = {
        ...options.metadata,
        uploadedAt: new Date().toISOString()
      };

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options.contentType || 'application/octet-stream',
        Metadata: metadata,
        ACL: options.public ? 'public-read' : 'private'
      });

      await this.s3Client.send(command);

      const url = await this.getFileUrl(key, options.expiresIn);
      const cdnUrl = this.getCdnUrl(key);

      logger.info('File uploaded successfully', { key, size: body.length });

      return {
        key,
        url,
        cdnUrl,
        size: body.length,
        contentType: options.contentType || 'application/octet-stream',
        metadata
      };
    } catch (error) {
      logger.error('Failed to upload file', { key, error });
      throw new Error(`Failed to upload file: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get a signed URL for file access
   */
  async getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      logger.error('Failed to generate signed URL', { key, error });
      throw new Error(`Failed to generate signed URL: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get CDN URL for public files
   */
  getCdnUrl(key: string): string | undefined {
    if (!this.cdnEndpoint) return undefined;
    return `${this.cdnEndpoint}/${key}`;
  }

  /**
   * Download a file from storage
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }

      return Buffer.concat(chunks);
    } catch (error) {
      logger.error('Failed to download file', { key, error });
      throw new Error(`Failed to download file: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.s3Client.send(command);
      logger.info('File deleted successfully', { key });
    } catch (error) {
      logger.error('Failed to delete file', { key, error });
      throw new Error(`Failed to delete file: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (hasErrorName(error) && error.name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<StorageFile | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key
      });

      const response = await this.s3Client.send(command);
      const url = await this.getFileUrl(key);
      const cdnUrl = this.getCdnUrl(key);

      return {
        key,
        url,
        cdnUrl,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        metadata: response.Metadata
      };
    } catch (error) {
      if (hasErrorName(error) && error.name === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate a unique file key
   */
  generateFileKey(
    workspaceId: string,
    userId: string,
    filename: string,
    prefix: string = 'audio'
  ): string {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${prefix}/${workspaceId}/${userId}/${timestamp}-${sanitizedFilename}`;
  }
}