import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  initializeUpload,
  uploadFile,
  uploadChunk,
  getUploadStatus,
  cancelUpload,
  listUploads,
  uploadMiddleware
} from '../controllers/upload.controller';

const router = Router();

// All upload routes require authentication
router.use(authenticate);

/**
 * @route POST /api/upload/initialize
 * @desc Initialize a new file upload
 * @body { filename: string, fileSize: number, mimeType: string, workspaceId: string }
 */
router.post('/initialize', initializeUpload);

/**
 * @route POST /api/upload/file
 * @desc Upload a small file directly
 * @body FormData with 'file' and 'uploadId'
 */
router.post('/file', uploadMiddleware, uploadFile);

/**
 * @route POST /api/upload/chunk
 * @desc Upload a file chunk for multipart uploads
 * @body FormData with 'file', 'uploadId', 'chunkIndex', 'totalChunks'
 */
router.post('/chunk', uploadMiddleware, uploadChunk);

/**
 * @route GET /api/upload/:uploadId/status
 * @desc Get upload status and progress
 */
router.get('/:uploadId/status', getUploadStatus);

/**
 * @route DELETE /api/upload/:uploadId
 * @desc Cancel an upload
 */
router.delete('/:uploadId', cancelUpload);

/**
 * @route GET /api/upload
 * @desc List user uploads
 * @query { workspaceId?: string, status?: string, limit?: number, offset?: number }
 */
router.get('/', listUploads);

export default router;