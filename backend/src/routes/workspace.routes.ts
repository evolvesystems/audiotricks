import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireWorkspaceAccess } from '../middleware/workspace.middleware.js';
import * as workspaceController from '../controllers/workspace.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Workspace CRUD operations
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getWorkspaces);
router.get('/:id', requireWorkspaceAccess(), workspaceController.getWorkspace);
router.put('/:id', requireWorkspaceAccess('admin'), workspaceController.updateWorkspace);

// User management within workspace
router.get('/:id/users', requireWorkspaceAccess(), workspaceController.getWorkspaceUsers);
router.get('/:id/available-users', requireWorkspaceAccess('admin'), workspaceController.getAvailableUsers);
router.post('/:id/users', requireWorkspaceAccess('admin'), workspaceController.addUserToWorkspace);
router.post('/:id/invite', requireWorkspaceAccess('admin'), workspaceController.inviteToWorkspace);
router.put('/:id/users/:userId/role', requireWorkspaceAccess('admin'), workspaceController.updateWorkspaceUser);
router.delete('/:id/users/:userId', requireWorkspaceAccess('admin'), workspaceController.removeFromWorkspace);

export default router;