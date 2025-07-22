/**
 * Team routes
 */

import { Router } from 'express';
import * as teamController from '../controllers/team.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All team routes require authentication
router.use(authenticate);

// Team management operations
router.get('/members', teamController.getTeamMembers);
router.put('/members/:memberId/role', teamController.updateMemberRole);
router.delete('/members/:memberId', teamController.removeMember);
router.post('/invite', teamController.inviteMember);

export default router;