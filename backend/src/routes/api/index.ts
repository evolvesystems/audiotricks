import { Router } from 'express';
import { auth } from '../../core/auth';

// Import all route modules
import authRoutes from '../auth.routes';
import adminRoutes from '../admin.routes';
import workspaceRoutes from '../workspace.routes';
import uploadRoutes from '../upload.routes';
import processingRoutes from '../processing.routes';
import apiKeyRoutes from '../api-key.routes';
import usageRoutes from '../usage.routes';
import testimonialsRoutes from '../testimonials.js';
import projectRoutes from '../project.routes';
import jobRoutes from '../job.routes';
import dashboardRoutes from '../dashboard.routes';
import teamRoutes from '../team.routes';
import workspaceUserRoutes from '../workspace-user.routes';
import userRoutes from '../user.routes';
import { createPaymentRoutes } from '../payment.routes';
import { prisma } from '../../config/database';

/**
 * Main API router with API key authentication applied to all routes
 */
const apiRouter = Router();

// Apply API key authentication to all API routes
apiRouter.use(auth.verifyApiKey);

// Public routes (API key required, but no user auth needed)
apiRouter.use('/auth', authRoutes);
apiRouter.use('/testimonials', testimonialsRoutes);

// Protected routes (API key required, user auth optional/required per endpoint)
apiRouter.use('/workspaces', workspaceRoutes);
apiRouter.use('/upload', uploadRoutes);
apiRouter.use('/processing', processingRoutes);
apiRouter.use('/api-keys', apiKeyRoutes);
apiRouter.use('/usage', usageRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/jobs', jobRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/team', teamRoutes);
apiRouter.use('/user-workspaces', workspaceUserRoutes);
apiRouter.use('/user', userRoutes);
apiRouter.use('/payment', createPaymentRoutes(prisma));

// Admin routes (API key + admin role required)
apiRouter.use('/admin', adminRoutes);

export default apiRouter;