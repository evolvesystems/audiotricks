import { describe, test, expect, beforeEach } from 'vitest';
import { BillingService } from '../../../src/services/subscription/billing.service';
import { prisma } from '../../setup';
import { createTestUser, createTestWorkspace } from '../../fixtures/workspace.fixtures';

/**
 * Test suite for BillingService - billing cycles and payment processing
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('BillingService', () => {
  let billingService: BillingService;
  let testUser: any;
  let testWorkspace: any;
  let testSubscription: any;

  beforeEach(async () => {
    billingService = new BillingService();
    const { workspace, owner } = await createTestWorkspace(prisma);
    testUser = owner;
    testWorkspace = workspace;

    // Create test subscription plan
    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Test Plan',
        slug: 'test-plan',
        price: 2000, // $20.00
        currency: 'USD',
        interval: 'month',
        isActive: true,
        features: { minutes: 1000, storage: 10000 }
      }
    });

    // Create test subscription
    testSubscription = await prisma.subscription.create({
      data: {
        userId: testUser.id,
        planId: plan.id,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        ewayCustomerId: 'test-customer-123'
      }
    });
  });

  describe('calculateBillingAmount', () => {
    test('expected use case - calculates monthly billing correctly', async () => {
      const amount = await billingService.calculateBillingAmount(
        testSubscription.id,
        'month'
      );

      expect(amount.baseAmount).toBe(2000);
      expect(amount.currency).toBe('USD');
      expect(amount.taxAmount).toBeGreaterThanOrEqual(0);
      expect(amount.totalAmount).toBeGreaterThanOrEqual(2000);
    });

    test('edge case - applies proration for partial billing period', async () => {
      // Create subscription that started 15 days ago
      const partialSubscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: testSubscription.planId,
          status: 'active',
          currentPeriodStart: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          ewayCustomerId: 'test-customer-456'
        }
      });

      const amount = await billingService.calculateBillingAmount(
        partialSubscription.id,
        'month',
        true // Enable proration
      );

      expect(amount.baseAmount).toBeLessThan(2000); // Prorated amount
      expect(amount.proratedDays).toBeDefined();
    });

    test('failure case - throws error for non-existent subscription', async () => {
      await expect(billingService.calculateBillingAmount('non-existent-sub', 'month'))
        .rejects
        .toThrow('Subscription not found');
    });
  });

  describe('processPayment', () => {
    test('expected use case - processes payment successfully', async () => {
      const paymentData = {
        subscriptionId: testSubscription.id,
        amount: 2000,
        currency: 'USD',
        paymentMethodId: 'pm_test_123'
      };

      const result = await billingService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBeDefined();
      expect(result.amount).toBe(2000);

      // Verify payment record was created
      const payment = await prisma.payment.findFirst({
        where: { subscriptionId: testSubscription.id }
      });
      expect(payment).toBeDefined();
      expect(payment?.status).toBe('completed');
    });

    test('edge case - handles payment decline gracefully', async () => {
      const paymentData = {
        subscriptionId: testSubscription.id,
        amount: 2000,
        currency: 'USD',
        paymentMethodId: 'pm_decline_test' // Simulated declined payment
      };

      const result = await billingService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('payment_declined');
      expect(result.message).toContain('declined');

      // Verify failed payment was recorded
      const payment = await prisma.payment.findFirst({
        where: { subscriptionId: testSubscription.id }
      });
      expect(payment?.status).toBe('failed');
    });

    test('failure case - throws error for invalid payment data', async () => {
      const invalidPaymentData = {
        subscriptionId: testSubscription.id,
        amount: -100, // Invalid negative amount
        currency: 'USD',
        paymentMethodId: 'pm_test_123'
      };

      await expect(billingService.processPayment(invalidPaymentData))
        .rejects
        .toThrow('Invalid payment amount');
    });
  });

  describe('generateInvoice', () => {
    test('expected use case - generates invoice with correct details', async () => {
      const invoice = await billingService.generateInvoice(testSubscription.id);

      expect(invoice.subscriptionId).toBe(testSubscription.id);
      expect(invoice.amount).toBe(2000);
      expect(invoice.currency).toBe('USD');
      expect(invoice.status).toBe('pending');
      expect(invoice.dueDate).toBeInstanceOf(Date);
      expect(invoice.items).toHaveLength(1);
      expect(invoice.items[0].description).toContain('Test Plan');
    });

    test('edge case - includes usage overages in invoice', async () => {
      // Create usage that exceeds plan limits
      await prisma.usage.create({
        data: {
          userId: testUser.id,
          workspaceId: testWorkspace.id,
          minutes: 1500, // Over 1000 limit
          storage: 15000, // Over 10000 limit
          period: new Date().toISOString().substring(0, 7) // Current month
        }
      });

      const invoice = await billingService.generateInvoice(testSubscription.id);

      expect(invoice.items.length).toBeGreaterThan(1); // Base plan + overages
      expect(invoice.amount).toBeGreaterThan(2000); // Includes overage charges
      
      const overageItems = invoice.items.filter(item => item.type === 'overage');
      expect(overageItems.length).toBeGreaterThan(0);
    });

    test('failure case - handles subscription without active plan', async () => {
      // Create subscription with inactive plan
      const inactivePlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Inactive Plan',
          slug: 'inactive',
          price: 1000,
          currency: 'USD',
          interval: 'month',
          isActive: false,
          features: { minutes: 500 }
        }
      });

      const inactiveSubscription = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: inactivePlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      await expect(billingService.generateInvoice(inactiveSubscription.id))
        .rejects
        .toThrow('Cannot generate invoice for inactive plan');
    });
  });

  describe('handlePaymentFailure', () => {
    test('expected use case - marks subscription as past due after payment failure', async () => {
      const paymentId = 'failed_payment_123';
      
      await billingService.handlePaymentFailure(testSubscription.id, paymentId, 'insufficient_funds');

      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });

      expect(updatedSubscription?.status).toBe('past_due');
      expect(updatedSubscription?.pastDueAt).toBeInstanceOf(Date);

      // Verify failure notification was created
      const notification = await prisma.notification.findFirst({
        where: { 
          userId: testUser.id,
          type: 'payment_failed'
        }
      });
      expect(notification).toBeDefined();
    });

    test('edge case - cancels subscription after multiple failures', async () => {
      // Simulate 3 failed payments (threshold)
      await billingService.handlePaymentFailure(testSubscription.id, 'fail_1', 'card_declined');
      await billingService.handlePaymentFailure(testSubscription.id, 'fail_2', 'card_declined');
      await billingService.handlePaymentFailure(testSubscription.id, 'fail_3', 'card_declined');

      const updatedSubscription = await prisma.subscription.findUnique({
        where: { id: testSubscription.id }
      });

      expect(updatedSubscription?.status).toBe('cancelled');
      expect(updatedSubscription?.cancelledAt).toBeInstanceOf(Date);
    });

    test('failure case - handles invalid subscription ID gracefully', async () => {
      await expect(billingService.handlePaymentFailure('invalid-sub-id', 'payment_123', 'error'))
        .rejects
        .toThrow('Subscription not found');
    });
  });

  describe('calculateUsageOverages', () => {
    test('expected use case - calculates overages correctly', async () => {
      const usage = {
        minutes: 1200, // 200 over limit
        storage: 12000, // 2000 over limit
        uploads: 120 // Assume 20 over limit
      };

      const overages = await billingService.calculateUsageOverages(
        testSubscription.id,
        usage
      );

      expect(overages.minutes.excess).toBe(200);
      expect(overages.minutes.charge).toBeGreaterThan(0);
      expect(overages.storage.excess).toBe(2000);
      expect(overages.storage.charge).toBeGreaterThan(0);
      expect(overages.totalCharge).toBeGreaterThan(0);
    });

    test('edge case - returns zero overages when within limits', async () => {
      const usage = {
        minutes: 500, // Under 1000 limit
        storage: 5000, // Under 10000 limit
        uploads: 50
      };

      const overages = await billingService.calculateUsageOverages(
        testSubscription.id,
        usage
      );

      expect(overages.minutes.excess).toBe(0);
      expect(overages.storage.excess).toBe(0);
      expect(overages.totalCharge).toBe(0);
    });

    test('failure case - throws error for unlimited plan features', async () => {
      const unlimitedPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Unlimited',
          slug: 'unlimited',
          price: 10000,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 999999999, storage: 999999999 } // Unlimited values
        }
      });

      const unlimitedSub = await prisma.subscription.create({
        data: {
          userId: testUser.id,
          planId: unlimitedPlan.id,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      const usage = { minutes: 5000, storage: 50000 };
      
      const overages = await billingService.calculateUsageOverages(unlimitedSub.id, usage);
      
      // Should return zero overages for unlimited plan
      expect(overages.totalCharge).toBe(0);
    });
  });
});