import { describe, test, expect, beforeEach } from 'vitest';
import { PlanService } from '../../../src/services/subscription/plan.service';
import { prisma } from '../../setup';
import { createTestUser, createTestWorkspace } from '../../fixtures/workspace.fixtures';

/**
 * Test suite for PlanService - core subscription plan management
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('PlanService', () => {
  let planService: PlanService;
  let testUser: any;
  let testWorkspace: any;

  beforeEach(async () => {
    planService = new PlanService();
    const { workspace, owner } = await createTestWorkspace(prisma);
    testUser = owner;
    testWorkspace = workspace;
  });

  describe('getAllPlans', () => {
    test('expected use case - returns active subscription plans', async () => {
      // Setup test plans
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

      const plans = await planService.getAllPlans();

      expect(plans).toHaveLength(2);
      expect(plans[0].name).toBe('Free');
      expect(plans[1].name).toBe('Pro');
      expect(plans[0].isActive).toBe(true);
    });

    test('edge case - filters out inactive plans', async () => {
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'Active Plan',
            slug: 'active',
            price: 1000,
            currency: 'USD',
            interval: 'month',
            isActive: true,
            features: { minutes: 500 }
          },
          {
            name: 'Inactive Plan',
            slug: 'inactive',
            price: 1500,
            currency: 'USD',
            interval: 'month',
            isActive: false,
            features: { minutes: 750 }
          }
        ]
      });

      const plans = await planService.getAllPlans();

      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Active Plan');
    });

    test('failure case - handles database connection error', async () => {
      // Mock database error
      const mockPrisma = {
        subscriptionPlan: {
          findMany: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        }
      };
      
      const planServiceWithError = new PlanService();
      (planServiceWithError as any).prisma = mockPrisma;

      await expect(planServiceWithError.getAllPlans())
        .rejects
        .toThrow('Database connection failed');
    });
  });

  describe('getPlanBySlug', () => {
    test('expected use case - returns plan for valid slug', async () => {
      const planData = {
        name: 'Professional',
        slug: 'professional',
        price: 3000,
        currency: 'USD',
        interval: 'month',
        isActive: true,
        features: { minutes: 2000, storage: 20000 }
      };

      await prisma.subscriptionPlan.create({ data: planData });

      const plan = await planService.getPlanBySlug('professional');

      expect(plan).toBeDefined();
      expect(plan?.name).toBe('Professional');
      expect(plan?.price).toBe(3000);
      expect(plan?.features).toEqual({ minutes: 2000, storage: 20000 });
    });

    test('edge case - returns null for non-existent slug', async () => {
      const plan = await planService.getPlanBySlug('non-existent-plan');
      expect(plan).toBeNull();
    });

    test('failure case - throws error for invalid slug format', async () => {
      await expect(planService.getPlanBySlug(''))
        .rejects
        .toThrow('Plan slug is required');

      await expect(planService.getPlanBySlug('   '))
        .rejects
        .toThrow('Plan slug is required');
    });
  });

  describe('validatePlanFeatures', () => {
    test('expected use case - validates usage against plan limits', async () => {
      const planData = {
        name: 'Test Plan',
        slug: 'test',
        price: 1000,
        currency: 'USD',
        interval: 'month',
        isActive: true,
        features: { 
          minutes: 500, 
          storage: 5000,
          uploads: 100 
        }
      };

      const plan = await prisma.subscriptionPlan.create({ data: planData });

      const usage = {
        minutes: 250,
        storage: 2000,
        uploads: 50
      };

      const result = await planService.validatePlanFeatures(plan.id, usage);

      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    test('edge case - identifies limit violations', async () => {
      const planData = {
        name: 'Limited Plan',
        slug: 'limited',
        price: 500,
        currency: 'USD',
        interval: 'month',
        isActive: true,
        features: { 
          minutes: 100, 
          storage: 1000 
        }
      };

      const plan = await prisma.subscriptionPlan.create({ data: planData });

      const usage = {
        minutes: 150, // Over limit
        storage: 1500 // Over limit
      };

      const result = await planService.validatePlanFeatures(plan.id, usage);

      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('minutes');
      expect(result.violations).toContain('storage');
    });

    test('failure case - throws error for non-existent plan', async () => {
      const usage = { minutes: 100 };

      await expect(planService.validatePlanFeatures('non-existent-id', usage))
        .rejects
        .toThrow('Plan not found');
    });
  });

  describe('calculatePlanUpgrade', () => {
    test('expected use case - calculates upgrade pricing correctly', async () => {
      const basicPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Basic',
          slug: 'basic',
          price: 1000,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 300 }
        }
      });

      const proPlan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Pro',
          slug: 'pro',
          price: 2500,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 1000 }
        }
      });

      const upgrade = await planService.calculatePlanUpgrade(basicPlan.id, proPlan.id, 15); // 15 days remaining

      expect(upgrade.proratedAmount).toBeGreaterThan(0);
      expect(upgrade.newPlanPrice).toBe(2500);
      expect(upgrade.remainingDays).toBe(15);
    });

    test('edge case - handles same plan upgrade (no change)', async () => {
      const plan = await prisma.subscriptionPlan.create({
        data: {
          name: 'Same Plan',
          slug: 'same',
          price: 1500,
          currency: 'USD',
          interval: 'month',
          isActive: true,
          features: { minutes: 500 }
        }
      });

      const upgrade = await planService.calculatePlanUpgrade(plan.id, plan.id, 20);

      expect(upgrade.proratedAmount).toBe(0);
      expect(upgrade.newPlanPrice).toBe(1500);
    });

    test('failure case - throws error for invalid plan IDs', async () => {
      await expect(planService.calculatePlanUpgrade('invalid-from', 'invalid-to', 10))
        .rejects
        .toThrow('Invalid plan configuration');
    });
  });
});