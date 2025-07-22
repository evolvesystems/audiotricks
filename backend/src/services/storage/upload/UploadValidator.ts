/**
 * Upload Validator
 * Validates file uploads and enforces limits
 */

import { PrismaClient } from '@prisma/client';
import { config } from '../../../config';
import { logger } from '../../../utils/logger';

export class UploadValidator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async validateUpload(
    userId: string,
    workspaceId: string,
    filename: string,
    fileSize: number,
    mimeType: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check file size limits
      const maxFileSize = config.maxFileSize || 500 * 1024 * 1024; // 500MB default
      if (fileSize > maxFileSize) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${Math.round(maxFileSize / 1024 / 1024)}MB`
        };
      }

      // Check file type
      const allowedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/flac',
        'audio/ogg',
        'audio/webm',
        'video/mp4',
        'video/webm'
      ];

      if (!allowedMimeTypes.includes(mimeType)) {
        return {
          valid: false,
          error: 'Unsupported file type. Please upload audio or video files only.'
        };
      }

      // Check filename
      if (!filename || filename.length > 255) {
        return {
          valid: false,
          error: 'Invalid filename. Must be 1-255 characters long.'
        };
      }

      // Check user storage quota
      const storageUsed = await this.getUserStorageUsage(userId);
      const userStorageLimit = await this.getUserStorageLimit(userId, workspaceId);
      
      if (storageUsed + fileSize > userStorageLimit) {
        return {
          valid: false,
          error: 'Storage quota exceeded. Please upgrade your plan or delete old files.'
        };
      }

      // Check workspace limits
      const workspaceUsage = await this.getWorkspaceStorageUsage(workspaceId);
      const workspaceLimit = await this.getWorkspaceStorageLimit(workspaceId);
      
      if (workspaceUsage + fileSize > workspaceLimit) {
        return {
          valid: false,
          error: 'Workspace storage limit exceeded.'
        };
      }

      return { valid: true };
    } catch (error) {
      logger.error(`Upload validation failed: ${error}`);
      return {
        valid: false,
        error: 'Validation failed. Please try again.'
      };
    }
  }

  private async getUserStorageUsage(userId: string): Promise<number> {
    try {
      const result = await this.prisma.audioUpload.aggregate({
        where: { userId },
        _sum: { fileSize: true }
      });
      return Number(result._sum.fileSize) || 0;
    } catch (error) {
      logger.error(`Failed to get user storage usage: ${error}`);
      return 0;
    }
  }

  private async getUserStorageLimit(userId: string, workspaceId: string): Promise<number> {
    try {
      // Get user's subscription plan limits
      const workspace = await this.prisma.workspace.findFirst({
        where: { id: workspaceId },
        include: {
          subscriptions: {
            where: { status: 'active' },
            include: { plan: true }
          }
        }
      });

      if (workspace?.subscriptions[0]?.plan) {
        const planLimits = workspace.subscriptions[0].plan.quotas as any;
        return planLimits?.maxStorageGB ? planLimits.maxStorageGB * 1024 * 1024 * 1024 : 10 * 1024 * 1024 * 1024;
      }

      return 1 * 1024 * 1024 * 1024; // 1GB default for free users
    } catch (error) {
      logger.error(`Failed to get user storage limit: ${error}`);
      return 1 * 1024 * 1024 * 1024; // 1GB fallback
    }
  }

  private async getWorkspaceStorageUsage(workspaceId: string): Promise<number> {
    try {
      const result = await this.prisma.audioUpload.aggregate({
        where: { workspaceId },
        _sum: { fileSize: true }
      });
      return Number(result._sum.fileSize) || 0;
    } catch (error) {
      logger.error(`Failed to get workspace storage usage: ${error}`);
      return 0;
    }
  }

  private async getWorkspaceStorageLimit(workspaceId: string): Promise<number> {
    try {
      const quota = await this.prisma.storageQuota.findUnique({
        where: { workspaceId }
      });
      return Number(quota?.totalBytes) || 50 * 1024 * 1024 * 1024; // 50GB default
    } catch (error) {
      logger.error(`Failed to get workspace storage limit: ${error}`);
      return 50 * 1024 * 1024 * 1024; // 50GB fallback
    }
  }
}