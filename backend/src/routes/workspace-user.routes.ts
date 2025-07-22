/**
 * Workspace User routes - User-centric workspace operations
 */

import { Router } from 'express';
import * as workspaceUserController from '../controllers/workspace-user.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All workspace user routes require authentication
router.use(authenticate);

// User workspace operations
router.get('/', workspaceUserController.getUserWorkspaces);
router.post('/', workspaceUserController.createWorkspace);
router.put('/:workspaceId', workspaceUserController.updateWorkspace);
router.delete('/:workspaceId/leave', workspaceUserController.leaveWorkspace);

export default router;