/**
 * Admin subscription management routes
 */

import { Router } from 'express';
import { AdminSubscriptionController } from '../../controllers/admin/admin-subscription.controller';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const adminSubscriptionController = new AdminSubscriptionController();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Subscription plan management
router.get('/plans', adminSubscriptionController.getSubscriptionPlans.bind(adminSubscriptionController));
router.post('/plans', adminSubscriptionController.createSubscriptionPlan.bind(adminSubscriptionController));
router.put('/plans/:planId', adminSubscriptionController.updateSubscriptionPlan.bind(adminSubscriptionController));
router.delete('/plans/:planId', adminSubscriptionController.deleteSubscriptionPlan.bind(adminSubscriptionController));

// Subscription monitoring
router.get('/subscriptions', adminSubscriptionController.getAllSubscriptions.bind(adminSubscriptionController));

// Analytics
router.get('/analytics/billing', adminSubscriptionController.getBillingAnalytics.bind(adminSubscriptionController));
router.get('/analytics/usage', adminSubscriptionController.getUsageAnalytics.bind(adminSubscriptionController));

export default router;