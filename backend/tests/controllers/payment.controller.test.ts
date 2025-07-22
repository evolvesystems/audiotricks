import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Request, Response } from 'express';
import { PaymentController } from '../../src/controllers/payment.controller';
import { PrismaClient } from '@prisma/client';

/**
 * Comprehensive tests for PaymentController
 * Following CLAUDE.md requirements: Expected use case, Edge case, Failure case
 */

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock Prisma client
const mockPrisma = {
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  workspace: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  subscription: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  paymentMethod: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

// Mock authentication middleware
const mockAuth = (req: Request, res: Response, next: any) => {
  req.user = { id: 'user-123', email: 'test@example.com' };
  next();
};

describe('PaymentController', () => {
  let paymentController: PaymentController;

  beforeEach(() => {
    paymentController = new PaymentController(mockPrisma);
    vi.clearAllMocks();
    
    // Setup routes
    app.use('/api/payment', mockAuth);
    app.get('/api/payment/plans', (req, res) => paymentController.getPlans(req, res));
    app.get('/api/payment/currencies', (req, res) => paymentController.getCurrencies(req, res));
    app.post('/api/payment/subscription', (req, res) => paymentController.createSubscription(req, res));
    app.get('/api/payment/subscription/:workspaceId', (req, res) => paymentController.getSubscription(req, res));
    app.put('/api/payment/subscription/:subscriptionId', (req, res) => paymentController.updateSubscription(req, res));
    app.delete('/api/payment/subscription/:subscriptionId', (req, res) => paymentController.cancelSubscription(req, res));
    app.get('/api/payment/billing/:workspaceId', (req, res) => paymentController.getBillingHistory(req, res));
    app.get('/api/payment/usage/:workspaceId', (req, res) => paymentController.getCurrentUsage(req, res));
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPlans', () => {
    it('should return available subscription plans (expected use case)', async () => {
      // Arrange
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'basic',
          displayName: 'Basic Plan',
          pricing: [{ currency: 'AUD', price: 29.99, billingPeriod: 'monthly' }],
          features: { transcription: true },
          quotas: { storage_gb: 10 },
          isActive: true
        },
        {
          id: 'plan-2',
          name: 'pro',
          displayName: 'Pro Plan',
          pricing: [{ currency: 'AUD', price: 79.99, billingPeriod: 'monthly' }],
          features: { transcription: true, advancedAnalysis: true },
          quotas: { storage_gb: 50 },
          isActive: true
        }
      ];

      // Mock subscription service to return plans
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getPlans: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(200).json({
            success: true,
            data: { plans: mockPlans }
          });
        })
      });

      // Act
      const response = await request(app)
        .get('/api/payment/plans?currency=AUD');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plans).toHaveLength(2);
      expect(response.body.data.plans[0].name).toBe('basic');
      expect(response.body.data.plans[1].name).toBe('pro');
    });

    it('should handle currency parameter correctly (edge case)', async () => {
      // Arrange
      const currency = 'USD';
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getPlans: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          const { currency: requestedCurrency } = req.query;
          expect(requestedCurrency).toBe(currency);
          res.status(200).json({
            success: true,
            data: { plans: [] }
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/plans?currency=${currency}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle service errors gracefully (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getPlans: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(500).json({
            success: false,
            error: 'Database connection failed'
          });
        })
      });

      // Act
      const response = await request(app)
        .get('/api/payment/plans');

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('createSubscription', () => {
    const validSubscriptionData = {
      workspaceId: 'workspace-123',
      planId: 'plan-basic',
      paymentMethodId: 'pm_test_123',
      currency: 'AUD',
      paymentGateway: 'eway',
      customerEmail: 'test@example.com',
      customerName: 'Test User'
    };

    it('should create subscription successfully (expected use case)', async () => {
      // Arrange
      const mockSubscription = {
        id: 'sub-123',
        workspaceId: validSubscriptionData.workspaceId,
        plan: { id: validSubscriptionData.planId, name: 'Basic Plan' },
        status: 'active',
        currency: validSubscriptionData.currency,
        amount: 29.99
      };

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        createSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          const requestData = req.body;
          expect(requestData.workspaceId).toBe(validSubscriptionData.workspaceId);
          expect(requestData.planId).toBe(validSubscriptionData.planId);
          
          res.status(201).json({
            success: true,
            data: { subscription: mockSubscription }
          });
        })
      });

      // Act
      const response = await request(app)
        .post('/api/payment/subscription')
        .send(validSubscriptionData);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.id).toBe('sub-123');
      expect(response.body.data.subscription.status).toBe('active');
    });

    it('should handle missing payment method (edge case)', async () => {
      // Arrange
      const invalidData = { ...validSubscriptionData };
      delete (invalidData as any).paymentMethodId;

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        createSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(400).json({
            success: false,
            error: 'Payment method ID is required'
          });
        })
      });

      // Act
      const response = await request(app)
        .post('/api/payment/subscription')
        .send(invalidData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment method ID is required');
    });

    it('should handle unauthenticated requests (failure case)', async () => {
      // Arrange - Create route without authentication
      const unauthApp = express();
      unauthApp.use(express.json());
      unauthApp.post('/api/payment/subscription', (req, res) => paymentController.createSubscription(req, res));

      // Act
      const response = await request(unauthApp)
        .post('/api/payment/subscription')
        .send(validSubscriptionData);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('User authentication required');
    });
  });

  describe('getSubscription', () => {
    const workspaceId = 'workspace-123';

    it('should return workspace subscription (expected use case)', async () => {
      // Arrange
      const mockSubscription = {
        id: 'sub-123',
        workspaceId,
        plan: { id: 'plan-basic', name: 'Basic Plan' },
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        currency: 'AUD',
        amount: 29.99
      };

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          expect(req.params.workspaceId).toBe(workspaceId);
          res.status(200).json({
            success: true,
            data: { subscription: mockSubscription }
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/subscription/${workspaceId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.id).toBe('sub-123');
      expect(response.body.data.subscription.workspaceId).toBe(workspaceId);
    });

    it('should handle non-existent workspace (edge case)', async () => {
      // Arrange
      const nonExistentWorkspaceId = 'workspace-999';

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(404).json({
            success: false,
            error: 'Subscription not found'
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/subscription/${nonExistentWorkspaceId}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Subscription not found');
    });

    it('should handle database connection errors (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(500).json({
            success: false,
            error: 'Database connection timeout'
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/subscription/${workspaceId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database connection timeout');
    });
  });

  describe('updateSubscription', () => {
    const subscriptionId = 'sub-123';
    const updateData = { newPlanId: 'plan-pro' };

    it('should update subscription plan successfully (expected use case)', async () => {
      // Arrange
      const mockUpdatedSubscription = {
        id: subscriptionId,
        plan: { id: 'plan-pro', name: 'Pro Plan' },
        status: 'active',
        currency: 'AUD',
        amount: 79.99
      };

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        updateSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          expect(req.params.subscriptionId).toBe(subscriptionId);
          expect(req.body.newPlanId).toBe(updateData.newPlanId);
          
          res.status(200).json({
            success: true,
            data: { subscription: mockUpdatedSubscription }
          });
        })
      });

      // Act
      const response = await request(app)
        .put(`/api/payment/subscription/${subscriptionId}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.plan.id).toBe('plan-pro');
      expect(response.body.data.subscription.amount).toBe(79.99);
    });

    it('should handle invalid plan ID (edge case)', async () => {
      // Arrange
      const invalidUpdateData = { newPlanId: 'plan-nonexistent' };

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        updateSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(404).json({
            success: false,
            error: 'Plan not found'
          });
        })
      });

      // Act
      const response = await request(app)
        .put(`/api/payment/subscription/${subscriptionId}`)
        .send(invalidUpdateData);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Plan not found');
    });

    it('should handle payment processing failures (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        updateSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(402).json({
            success: false,
            error: 'Payment required - card declined'
          });
        })
      });

      // Act
      const response = await request(app)
        .put(`/api/payment/subscription/${subscriptionId}`)
        .send(updateData);

      // Assert
      expect(response.status).toBe(402);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment required - card declined');
    });
  });

  describe('cancelSubscription', () => {
    const subscriptionId = 'sub-123';
    const cancelData = { reason: 'Too expensive' };

    it('should cancel subscription successfully (expected use case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        cancelSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          expect(req.params.subscriptionId).toBe(subscriptionId);
          expect(req.body.reason).toBe(cancelData.reason);
          
          res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully'
          });
        })
      });

      // Act
      const response = await request(app)
        .delete(`/api/payment/subscription/${subscriptionId}`)
        .send(cancelData);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Subscription cancelled successfully');
    });

    it('should handle already cancelled subscription (edge case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        cancelSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(400).json({
            success: false,
            error: 'Subscription is already cancelled'
          });
        })
      });

      // Act
      const response = await request(app)
        .delete(`/api/payment/subscription/${subscriptionId}`)
        .send(cancelData);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Subscription is already cancelled');
    });

    it('should handle service unavailable (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        cancelSubscription: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(503).json({
            success: false,
            error: 'Payment gateway service temporarily unavailable'
          });
        })
      });

      // Act
      const response = await request(app)
        .delete(`/api/payment/subscription/${subscriptionId}`)
        .send(cancelData);

      // Assert
      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Payment gateway service temporarily unavailable');
    });
  });

  describe('getBillingHistory', () => {
    const workspaceId = 'workspace-123';

    it('should return billing history (expected use case)', async () => {
      // Arrange
      const mockBillingHistory = [
        {
          id: 'inv-1',
          amount: 29.99,
          currency: 'AUD',
          status: 'paid',
          invoiceNumber: 'INV-001',
          paidAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'inv-2',
          amount: 29.99,
          currency: 'AUD',
          status: 'paid',
          invoiceNumber: 'INV-002',
          paidAt: '2024-02-01T00:00:00Z',
          createdAt: '2024-02-01T00:00:00Z'
        }
      ];

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getBillingHistory: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          expect(req.params.workspaceId).toBe(workspaceId);
          
          res.status(200).json({
            success: true,
            data: { billingHistory: mockBillingHistory }
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/billing/${workspaceId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.billingHistory).toHaveLength(2);
      expect(response.body.data.billingHistory[0].invoiceNumber).toBe('INV-001');
    });

    it('should handle limit parameter (edge case)', async () => {
      // Arrange
      const limit = 5;
      
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getBillingHistory: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          const requestedLimit = parseInt(req.query.limit as string);
          expect(requestedLimit).toBe(limit);
          
          res.status(200).json({
            success: true,
            data: { billingHistory: [] }
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/billing/${workspaceId}?limit=${limit}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle unauthorized access (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getBillingHistory: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(403).json({
            success: false,
            error: 'Access denied to workspace billing information'
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/billing/${workspaceId}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access denied to workspace billing information');
    });
  });

  describe('getCurrentUsage', () => {
    const workspaceId = 'workspace-123';

    it('should return current usage data (expected use case)', async () => {
      // Arrange
      const mockUsageData = {
        subscriptionId: 'sub-123',
        planName: 'Basic Plan',
        currentPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-02-01T00:00:00Z'
        },
        usage: {
          transcription_minutes: { quantity: 150, cost: 15.0 },
          storage_gb: { quantity: 5.2, cost: 0.0 }
        },
        quotas: {
          transcription_minutes: 300,
          storage_gb: 10
        },
        totalCost: 15.0
      };

      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getCurrentUsage: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          expect(req.params.workspaceId).toBe(workspaceId);
          
          res.status(200).json({
            success: true,
            data: { usage: mockUsageData }
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/usage/${workspaceId}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.usage.subscriptionId).toBe('sub-123');
      expect(response.body.data.usage.usage.transcription_minutes.quantity).toBe(150);
      expect(response.body.data.usage.totalCost).toBe(15.0);
    });

    it('should handle workspace without subscription (edge case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getCurrentUsage: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(404).json({
            success: false,
            error: 'No active subscription found for workspace'
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/usage/${workspaceId}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No active subscription found for workspace');
    });

    it('should handle quota calculation errors (failure case)', async () => {
      // Arrange
      vi.spyOn(paymentController as any, 'subscriptionController', 'get').mockReturnValue({
        getCurrentUsage: vi.fn().mockImplementation(async (req: Request, res: Response) => {
          res.status(500).json({
            success: false,
            error: 'Failed to calculate usage metrics'
          });
        })
      });

      // Act
      const response = await request(app)
        .get(`/api/payment/usage/${workspaceId}`);

      // Assert
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to calculate usage metrics');
    });
  });
});