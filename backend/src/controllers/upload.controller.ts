import { Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../services/storage/storage.service';
import { FileUploadService } from '../services/storage/file-upload.service';
import { UsageTrackingService } from '../services/usage/usage-tracking.service';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-handler';

const prisma = new PrismaClient();
const storageService = new StorageService();
const fileUploadService = new FileUploadService(storageService);
const usageTracking = new UsageTrackingService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files
    const allowedMimeTypes = [
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
      'video/mp4', // For video files with audio
      'video/webm',
      'video/quicktime'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

/**
 * Initialize a new file upload
 */
export const initializeUpload = async (req: Request, res: Response) => {
  try {
    const { filename, fileSize, mimeType, workspaceId } = req.body;
    const userId = req.user!.id;

    // Validate inputs
    if (!filename || !fileSize || !mimeType || !workspaceId) {
      res.status(400).json({
        error: 'Missing required fields: filename, fileSize, mimeType, workspaceId'
      });
      return;
    }

    // Check workspace access
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        users: {
          some: { userId }
        }
      }
    });

    if (!workspace) {
      res.status(403).json({
        error: 'Access denied to workspace'
      });
      return;
    }

    // Check storage quota
    const quotaCheck = await usageTracking.enforceQuota(workspaceId, 'storage', fileSize);
    if (!quotaCheck.allowed) {
      res.status(429).json({
        error: 'Storage quota exceeded',
        message: quotaCheck.reason,
        suggestion: quotaCheck.suggestion
      });
      return;
    }

    // Initialize upload
    const uploadId = await fileUploadService.initializeUpload(
      userId,
      workspaceId,
      filename,
      fileSize,
      mimeType
    );

    // For large files, generate presigned URLs for multipart upload
    let uploadUrls: string[] = [];
    if (fileSize > 100 * 1024 * 1024) { // 100MB
      const chunkCount = Math.ceil(fileSize / (10 * 1024 * 1024)); // 10MB chunks
      uploadUrls = await fileUploadService.generateUploadUrls(uploadId, chunkCount);
    }

    res.json({
      uploadId,
      multipart: fileSize > 100 * 1024 * 1024,
      uploadUrls,
      chunkSize: 10 * 1024 * 1024 // 10MB
    });
    return;

  } catch (error) {
    logger.error('Failed to initialize upload', { error });
    res.status(500).json({
      error: 'Failed to initialize upload',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Upload a small file directly
 */
export const uploadFile = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!uploadId) {
      return res.status(400).json({ error: 'Upload ID required' });
    }

    // Upload the file
    await fileUploadService.uploadSingleFile(uploadId, file.buffer);

    // Get upload info
    const upload = await prisma.audioUpload.findUnique({
      where: { id: uploadId },
      select: {
        id: true,
        originalFileName: true,
        fileSize: true,
        uploadStatus: true,
        storageUrl: true,
        cdnUrl: true,
        createdAt: true,
        workspaceId: true
      }
    });

    // Track usage
    if (upload) {
      await usageTracking.trackUsage(
        upload.workspaceId,
        'storage',
        Number(upload.fileSize),
        {
          uploadId: upload.id,
          fileName: upload.originalFileName
        }
      );
    }

    res.json({
      success: true,
      upload
    });
    return;

  } catch (error) {
    logger.error('Failed to upload file', { error });
    res.status(500).json({
      error: 'Failed to upload file',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Upload a file chunk (for multipart uploads)
 */
export const uploadChunk = async (req: Request, res: Response) => {
  try {
    const { uploadId, chunkIndex, totalChunks } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No chunk provided' });
    }

    if (!uploadId || chunkIndex === undefined || !totalChunks) {
      return res.status(400).json({
        error: 'Upload ID, chunk index, and total chunks required'
      });
    }

    // Upload the chunk
    const result = await fileUploadService.uploadChunk(
      uploadId,
      file.buffer,
      parseInt(chunkIndex),
      parseInt(totalChunks)
    );

    res.json({
      success: true,
      chunk: result,
      progress: ((parseInt(chunkIndex) + 1) / parseInt(totalChunks)) * 100
    });
    return;

  } catch (error) {
    logger.error('Failed to upload chunk', { error });
    res.status(500).json({
      error: 'Failed to upload chunk',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Get upload status
 */
export const getUploadStatus = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user!.id;

    const upload = await prisma.audioUpload.findFirst({
      where: {
        id: uploadId,
        userId
      },
      include: {
        audioChunks: {
          orderBy: { chunkIndex: 'asc' }
        },
        processingJobs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({
      id: upload.id,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize.toString(),
      uploadStatus: upload.uploadStatus,
      uploadProgress: upload.uploadProgress,
      storageUrl: upload.storageUrl,
      cdnUrl: upload.cdnUrl,
      chunks: upload.audioChunks.map(chunk => ({
        index: chunk.chunkIndex,
        size: chunk.size.toString(),
        uploaded: !!chunk.uploadedAt
      })),
      processingJobs: upload.processingJobs.map(job => ({
        id: job.id,
        type: job.jobType,
        status: job.status,
        progress: job.progress
      })),
      createdAt: upload.createdAt,
      updatedAt: upload.updatedAt
    });
    return;

  } catch (error) {
    logger.error('Failed to get upload status', { error });
    res.status(500).json({
      error: 'Failed to get upload status',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Cancel an upload
 */
export const cancelUpload = async (req: Request, res: Response) => {
  try {
    const { uploadId } = req.params;
    const userId = req.user!.id;

    // Verify ownership
    const upload = await prisma.audioUpload.findFirst({
      where: {
        id: uploadId,
        userId
      }
    });

    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Cancel the upload
    await fileUploadService.cancelUpload(uploadId);

    res.json({
      success: true,
      message: 'Upload cancelled'
    });
    return;

  } catch (error) {
    logger.error('Failed to cancel upload', { error });
    res.status(500).json({
      error: 'Failed to cancel upload',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * List user uploads
 */
export const listUploads = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { workspaceId, status, limit = '20', offset = '0' } = req.query;

    const where: any = { userId };
    
    if (workspaceId) {
      where.workspaceId = workspaceId as string;
    }
    
    if (status) {
      where.uploadStatus = status as string;
    }

    const uploads = await prisma.audioUpload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id: true,
        originalFileName: true,
        fileSize: true,
        uploadStatus: true,
        uploadProgress: true,
        cdnUrl: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const total = await prisma.audioUpload.count({ where });

    res.json({
      uploads: uploads.map(upload => ({
        ...upload,
        fileSize: upload.fileSize.toString()
      })),
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + parseInt(limit as string) < total
      }
    });
    return;

  } catch (error) {
    logger.error('Failed to list uploads', { error });
    res.status(500).json({
      error: 'Failed to list uploads',
      details: getErrorMessage(error)
    });
    return;
  }
};

// Export multer middleware for use in routes
export const uploadMiddleware = upload.single('file');