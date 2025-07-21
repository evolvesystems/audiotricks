/**
 * Admin eWAY payment gateway management routes
 */

import { Router } from 'express';
import { AdminEwayController } from '../../controllers/admin/admin-eway.controller';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';

const router = Router();
const adminEwayController = new AdminEwayController();

// Apply auth and admin middleware to all routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Transaction management
router.get('/overview', adminEwayController.getTransactionOverview.bind(adminEwayController));
router.get('/transactions', adminEwayController.getTransactions.bind(adminEwayController));

// Customer management  
router.get('/customers', adminEwayController.getCustomers.bind(adminEwayController));

// Recurring payment management
router.get('/recurring', adminEwayController.getRecurringSchedules.bind(adminEwayController));

// Webhook management
router.get('/webhooks', adminEwayController.getWebhookEvents.bind(adminEwayController));
router.post('/webhooks/:eventId/retry', adminEwayController.retryWebhookEvent.bind(adminEwayController));

// System health
router.get('/health', adminEwayController.getSystemHealth.bind(adminEwayController));

export default router;