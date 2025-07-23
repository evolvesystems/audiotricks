import { Router } from 'express';
import { auth } from '../core/auth/index.js';
import { requireWorkspaceAccess } from '../middleware/workspace.middleware.js';
import * as workspaceController from '../controllers/workspace.controller.js';

const router = Router();

// All workspace routes require user authentication
router.use(auth.getCurrentUserRequired);

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