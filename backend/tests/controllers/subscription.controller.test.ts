import { describe, test, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { SubscriptionController } from '../../src/controllers/subscription.controller';
import { prisma } from '../setup';
import { createTestUser, createTestWorkspace } from '../fixtures/workspace.fixtures';

/**
 * Integration test suite for SubscriptionController
 * Tests API endpoints and request/response flow
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('SubscriptionController Integration Tests', () => {
  let app: express.Application;
  let subscriptionController: SubscriptionController;
  let testUser: any;
  let testWorkspace: any;
  let authToken: string;

  beforeEach(async () => {
    // Setup Express app
    app = express();
    app.use(express.json());
    subscriptionController = new SubscriptionController();

    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: testUser?.id, workspaceId: testWorkspace?.id };
      next();
    });

    // Setup routes
    app.get('/subscriptions/plans', subscriptionController.getPlans.bind(subscriptionController));
    app.post('/subscriptions', subscriptionController.createSubscription.bind(subscriptionController));
    app.get('/subscriptions/:id', subscriptionController.getSubscription.bind(subscriptionController));
    app.put('/subscriptions/:id', subscriptionController.updateSubscription.bind(subscriptionController));
    app.delete('/subscriptions/:id', subscriptionController.cancelSubscription.bind(subscriptionController));

    // Create test data
    const { workspace, owner } = await createTestWorkspace(prisma);
    testUser = owner;
    testWorkspace = workspace;
    authToken = 'mock-jwt-token';

    // Create test subscription plans
    await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'Free',
          slug: 'free',
          price: 0,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 100, storage: 1000 }
        },
        {
          name: 'Pro',
          slug: 'pro',
          price: 2000,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 1000, storage: 10000 }
        }
      ]
    });
  });

  describe('GET /subscriptions/plans', () => {
    test('expected use case - returns all active subscription plans', async () => {
      const response = await request(app)
        .get('/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.plans).toHaveLength(2);
      expect(response.body.data.plans[0].name).toBe('Free');
      expect(response.body.data.plans[1].name).toBe('Pro');
      expect(response.body.data.plans[0].price).toBe(0);
      expect(response.body.data.plans[1].price).toBe(2000);
    });

    test('edge case - filters inactive plans', async () => {
      // Add inactive plan
      await prisma.subscriptionPlan.create({
        data: {
          name: 'Inactive Plan',
          slug: 'inactive',
          price: 5000,
          currency: 'USD',
          interval: 'month',
          isActive: false,
          features: { minutes: 5000 }
        }
      });

      const response = await request(app)
        .get('/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.plans).toHaveLength(2); // Still only active plans
      expect(response.body.data.plans.every((plan: any) => plan.isActive)).toBe(true);
    });

    test('failure case - handles database connection error', async () => {
      // Mock database error
      vi.spyOn(prisma.subscriptionPlan, 'findMany').mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/subscriptions/plans')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Database connection failed');
    });
  });

  describe('POST /subscriptions', () => {
    test('expected use case - creates subscription successfully', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      
      const subscriptionData = {
        planId: plan?.id,
        paymentMethodId: 'pm_test_123',
        billingDetails: {
          name: 'John Doe',
          email: 'john@example.com',
          address: {
            line1: '123 Test St',
            city: 'Test City',
            state: 'TS',
            postalCode: '12345',
            country: 'US'
          }
        }
      };

      // Mock eWAY successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          Customer: { TokenCustomerID: 'token_123' },
          Errors: []
        })
      });

      const response = await request(app)
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.planId).toBe(plan?.id);
      expect(response.body.data.subscription.status).toBe('active');
      expect(response.body.data.subscription.userId).toBe(testUser.id);

      // Verify subscription was created in database
      const createdSubscription = await prisma.subscription.findFirst({
        where: { userId: testUser.id, planId: plan?.id }
      });
      expect(createdSubscription).toBeDefined();
    });

    test('edge case - handles payment method validation failure', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      
      const invalidSubscriptionData = {
        planId: plan?.id,
        paymentMethodId: 'pm_invalid',
        billingDetails: {
          name: 'John Doe',
          email: 'invalid-email' // Invalid email format
        }
      };

      // Mock eWAY validation error
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          Customer: null,
          Errors: ['V6043'] // Invalid email
        })
      });

      const response = await request(app)
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidSubscriptionData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('payment method validation');
      expect(response.body.details).toContain('V6043');
    });

    test('failure case - rejects invalid plan ID', async () => {
      const subscriptionData = {
        planId: 'non-existent-plan-id',
        paymentMethodId: 'pm_test_123',
        billingDetails: {
          name: 'John Doe',
          email: 'john@example.com'
        }
      };

      const response = await request(app)
        .post('/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subscriptionData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Plan not found');
    });
  });

  describe('GET /subscriptions/:id', () => {
    test('expected use case - returns subscription details', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ewayCustomerId: 'token_123'
        }
      });

      const response = await request(app)
        .get(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.id).toBe(subscription.id);
      expect(response.body.data.subscription.status).toBe('active');
      expect(response.body.data.subscription.plan).toBeDefined();
      expect(response.body.data.subscription.plan.name).toBe('Pro');
    });

    test('edge case - denies access to other user\'s subscription', async () => {
      // Create another user and their subscription
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@example.com',
          name: 'Other User',
          passwordHash: 'hashed_password',
          isActive: true
        }
      });

      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
      const otherSubscription = await prisma.subscription.create({
        data: {
          userId: otherUser.id,
          planId: plan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      const response = await request(app)
        .get(`/subscriptions/${otherSubscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Subscription not found');
    });

    test('failure case - handles non-existent subscription ID', async () => {
      const response = await request(app)
        .get('/subscriptions/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Subscription not found');
    });
  });

  describe('PUT /subscriptions/:id', () => {
    test('expected use case - updates subscription plan successfully', async () => {
      const freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
      const proPlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: freePlan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ewayCustomerId: 'token_123'
        }
      });

      // Mock eWAY payment for upgrade
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          TransactionID: 'upgrade_txn_123',
          TransactionStatus: true,
          ResponseCode: '00'
        })
      });

      const updateData = {
        planId: proPlan?.id,
        prorationBehavior: 'immediate'
      };

      const response = await request(app)
        .put(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.subscription.planId).toBe(proPlan?.id);
      expect(response.body.data.prorationAmount).toBeGreaterThan(0);

      // Verify upgrade was recorded
      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(updatedSubscription?.planId).toBe(proPlan?.id);
    });

    test('edge case - handles downgrade with credit calculation', async () => {
      const proPlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const freePlan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'free' } });
      
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: proPlan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ewayCustomerId: 'token_123'
        }
      });

      const updateData = {
        planId: freePlan?.id,
        prorationBehavior: 'end_of_period'
      };

      const response = await request(app)
        .put(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.downgrade).toBe(true);
      expect(response.body.data.effectiveDate).toBeDefined();
      expect(response.body.data.creditAmount).toBeGreaterThan(0);
    });

    test('failure case - rejects update to inactive plan', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      const inactivePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Inactive Plan',
          slug: 'inactive',
          price: 3000,
          currency: 'USD',
          interval: 'month',
          isActive: false,
          features: { minutes: 2000 }
        }
      });

      const updateData = {
        planId: inactivePlan.id
      };

      const response = await request(app)
        .put(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Plan is not available');
    });
  });

  describe('DELETE /subscriptions/:id', () => {
    test('expected use case - cancels subscription successfully', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan!.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          ewayCustomerId: 'token_123'
        }
      });

      const cancellationData = {
        reason: 'User requested cancellation',
        feedback: 'Found a better alternative',
        cancelAtPeriodEnd: true
      };

      const response = await request(app)
        .delete(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancellationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancel_at_period_end');
      expect(response.body.data.cancelAtPeriodEnd).toBe(true);
      expect(response.body.data.accessUntil).toBeDefined();

      // Verify cancellation was recorded
      const cancelledSubscription = await prisma.subscription.findUnique({
        where: { id: subscription.id }
      });
      expect(cancelledSubscription?.status).toBe('cancel_at_period_end');
    });

    test('edge case - immediate cancellation with refund calculation', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan!.id,
          status: 'active',
          currentPeriodStart: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
          ewayCustomerId: 'token_123'
        }
      });

      // Mock eWAY refund
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          TransactionID: 'refund_123',
          TransactionStatus: true,
          ResponseCode: '00'
        })
      });

      const cancellationData = {
        reason: 'Billing dispute',
        cancelAtPeriodEnd: false // Immediate cancellation
      };

      const response = await request(app)
        .delete(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancellationData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('cancelled');
      expect(response.body.data.refundAmount).toBeGreaterThan(0);
      expect(response.body.data.refundTransactionId).toBe('refund_123');
    });

    test('failure case - prevents cancellation of already cancelled subscription', async () => {
      const plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'pro' } });
      const subscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: plan!.id,
          status: 'cancelled',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelledAt: new Date()
        }
      });

      const cancellationData = {
        reason: 'Test cancellation'
      };

      const response = await request(app)
        .delete(`/subscriptions/${subscription.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(cancellationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already cancelled');
    });
  });
});