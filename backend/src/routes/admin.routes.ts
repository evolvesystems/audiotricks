import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { AdminSubscriptionController } from '../controllers/admin/admin-subscription.controller';
import { AdminEwayController } from '../controllers/admin/admin-eway.controller';
import { AdminRolesController } from '../controllers/admin/admin-roles.controller';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

// Initialize new admin controllers
const adminSubscriptionController = new AdminSubscriptionController();
const adminEwayController = new AdminEwayController();
const adminRolesController = new AdminRolesController();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);

// Create new user
router.post('/users', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username').isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric, _, or -'),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
], validate, adminController.createUser);

// Update user
router.put('/users/:id', [
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('username').optional().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 characters, alphanumeric, _, or -'),
  body('password').optional().isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean')
], validate, adminController.updateUser);

// Delete user
router.delete('/users/:id', adminController.deleteUser);

// Quick actions
router.put('/users/:id/role', 
  body('role').isIn(['user', 'admin']).withMessage('Invalid role'),
  adminController.updateUserRole
);
router.put('/users/:id/toggle-status', adminController.toggleUserStatus);

// Statistics
router.get('/stats', adminController.getStats);

// ===== SUBSCRIPTION PLAN MANAGEMENT =====
router.get('/subscriptions/plans', adminSubscriptionController.getSubscriptionPlans.bind(adminSubscriptionController));
router.post('/subscriptions/plans', adminSubscriptionController.createSubscriptionPlan.bind(adminSubscriptionController));
router.put('/subscriptions/plans/:planId', adminSubscriptionController.updateSubscriptionPlan.bind(adminSubscriptionController));
router.delete('/subscriptions/plans/:planId', adminSubscriptionController.deleteSubscriptionPlan.bind(adminSubscriptionController));

// Subscription monitoring
router.get('/subscriptions', adminSubscriptionController.getAllSubscriptions.bind(adminSubscriptionController));

// Analytics
router.get('/analytics/billing', adminSubscriptionController.getBillingAnalytics.bind(adminSubscriptionController));
router.get('/analytics/usage', adminSubscriptionController.getUsageAnalytics.bind(adminSubscriptionController));

// ===== EWAY PAYMENT GATEWAY MANAGEMENT =====
router.get('/eway/overview', adminEwayController.getTransactionOverview.bind(adminEwayController));
router.get('/eway/transactions', adminEwayController.getTransactions.bind(adminEwayController));
router.get('/eway/customers', adminEwayController.getCustomers.bind(adminEwayController));
router.get('/eway/recurring', adminEwayController.getRecurringSchedules.bind(adminEwayController));
router.get('/eway/webhooks', adminEwayController.getWebhookEvents.bind(adminEwayController));
router.post('/eway/webhooks/:eventId/retry', adminEwayController.retryWebhookEvent.bind(adminEwayController));
router.get('/eway/health', adminEwayController.getSystemHealth.bind(adminEwayController));

// ===== ROLES & PERMISSIONS MANAGEMENT =====
router.get('/roles', adminRolesController.getRoles.bind(adminRolesController));
router.post('/roles', adminRolesController.createRole.bind(adminRolesController));
router.put('/roles/:roleId/permissions', adminRolesController.updateRolePermissions.bind(adminRolesController));
router.delete('/roles/:roleId', adminRolesController.deleteRole.bind(adminRolesController));

export default router;