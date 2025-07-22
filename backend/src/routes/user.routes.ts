/**
 * User routes - User-specific endpoints
 */

import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Jobs routes (under /api/user/jobs)
router.get('/jobs', jobController.getJobs);
router.get('/jobs/:id', jobController.getJob);
router.put('/jobs/:id', jobController.updateJob);
router.post('/jobs/:id/retry', jobController.retryJob);
router.delete('/jobs/:id', jobController.deleteJob);

export default router;