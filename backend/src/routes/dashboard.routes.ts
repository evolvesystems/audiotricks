/**
 * Dashboard routes
 */

import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard statistics and data
router.get('/stats', dashboardController.getDashboardStats);
router.get('/recent', dashboardController.getRecentActivity);

export default router;