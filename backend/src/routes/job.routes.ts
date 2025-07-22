/**
 * Job routes
 */

import { Router } from 'express';
import * as jobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All job routes require authentication
router.use(authenticate);

// Job operations
router.get('/', jobController.getJobs);
router.get('/:id', jobController.getJob);
router.put('/:id', jobController.updateJob);
router.post('/:id/retry', jobController.retryJob);
router.delete('/:id', jobController.deleteJob);

export default router;