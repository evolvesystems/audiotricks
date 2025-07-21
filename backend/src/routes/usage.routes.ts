import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getWorkspaceUsage,
  getUsageReport,
  getUsageHistory,
  checkQuota
} from '../controllers/usage.controller';

const router = Router();

// All usage routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/usage/:workspaceId
 * @desc    Get current usage and quota for a workspace
 * @access  Private
 */
router.get('/:workspaceId', getWorkspaceUsage);

/**
 * @route   GET /api/usage/:workspaceId/report
 * @desc    Get usage report for a workspace (admin only)
 * @access  Private (Admin)
 */
router.get('/:workspaceId/report', getUsageReport);

/**
 * @route   GET /api/usage/:workspaceId/history
 * @desc    Get usage history for a workspace
 * @access  Private
 */
router.get('/:workspaceId/history', getUsageHistory);

/**
 * @route   GET /api/usage/:workspaceId/quota/:resourceType
 * @desc    Check specific quota
 * @access  Private
 */
router.get('/:workspaceId/quota/:resourceType', checkQuota);

export default router;