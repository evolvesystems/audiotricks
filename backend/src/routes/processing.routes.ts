import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  startProcessing,
  getJobStatus,
  listJobs
} from '../controllers/processing.controller';

const router = Router();

// All processing routes require authentication
router.use(authenticate);

/**
 * @route POST /api/processing/start
 * @desc Start audio processing
 * @body { uploadId: string, jobType: 'transcription' | 'summary' | 'analysis', options?: object }
 */
router.post('/start', startProcessing);

/**
 * @route GET /api/processing/jobs/:jobId
 * @desc Get processing job status
 */
router.get('/jobs/:jobId', getJobStatus);

/**
 * @route GET /api/processing/jobs
 * @desc List processing jobs
 * @query { workspaceId?: string, status?: string, jobType?: string, limit?: number, offset?: number }
 */
router.get('/jobs', listJobs);

export default router;