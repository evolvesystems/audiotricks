import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService, CreateSubscriptionParams, SubscriptionDetails } from '../../../src/services/subscription/subscription.service';
import { PlanService } from '../../../src/services/subscription/plan.service';
import { BillingService } from '../../../src/services/subscription/billing.service';
import { SubscriptionLifecycleService } from '../../../src/services/subscription/subscription-lifecycle.service';

/**
 * Comprehensive tests for SubscriptionService
 * Following CLAUDE.md requirements: Expected use case, Edge case, Failure case
 */

// Mock the service dependencies
vi.mock('../../../src/services/subscription/plan.service');
vi.mock('../../../src/services/subscription/billing.service');
vi.mock('../../../src/services/subscription/subscription-lifecycle.service');

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockPlanService: vi.Mocked<PlanService>;
  let mockBillingService: vi.Mocked<BillingService>;
  let mockLifecycleService: vi.Mocked<SubscriptionLifecycleService>;

  beforeEach(() => {
    // Create mocked instances
    mockPlanService = {
      getAvailablePlans: vi.fn(),
      getSupportedCurrencies: vi.fn(),
      getPlanFeatures: vi.fn(),
      getPlanQuotas: vi.fn(),
      formatCurrency: vi.fn(),
    } as any;

    mockBillingService = {
      getBillingHistory: vi.fn(),
      getCurrentUsage: vi.fn(),
      recordUsage: vi.fn(),
      getWorkspaceLimits: vi.fn(),
      hasActiveSubscription: vi.fn(),
    } as any;

    mockLifecycleService = {
      createSubscription: vi.fn(),
      getWorkspaceSubscription: vi.fn(),
      updateSubscriptionPlan: vi.fn(),
      cancelSubscription: vi.fn(),
      getStatusBadge: vi.fn(),
      getDaysUntilTrialEnd: vi.fn(),
    } as any;

    subscriptionService = new SubscriptionService();
    
    // Inject mocked dependencies
    (subscriptionService as any).planService = mockPlanService;
    (subscriptionService as any).billingService = mockBillingService;
    (subscriptionService as any).lifecycleService = mockLifecycleService;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlans', () => {
    it('should retrieve available subscription plans (expected use case)', async () => {
      // Arrange
      const mockPlans = [
        {
          id: 'plan-basic',
          name: 'basic',
          displayName: 'Basic Plan',
          pricing: [{ currency: 'AUD', price: 29.99, billingPeriod: 'monthly' }],
          features: { transcription: true, basicAnalysis: true },
          quotas: { storage_gb: 10, transcription_minutes: 300 },
          isActive: true,
          tier: 'basic',
          trialDays: 14
        },
        {
          id: 'plan-pro',
          name: 'pro',
          displayName: 'Pro Plan',
          pricing: [{ currency: 'AUD', price: 79.99, billingPeriod: 'monthly' }],
          features: { transcription: true, basicAnalysis: true, advancedAnalysis: true },
          quotas: { storage_gb: 50, transcription_minutes: 1000 },
          isActive: true,
          tier: 'pro',
          trialDays: 14
        }
      ];
      
      mockPlanService.getAvailablePlans.mockResolvedValue(mockPlans);

      // Act
      const result = await subscriptionService.getPlans('AUD');

      // Assert
      expect(mockPlanService.getAvailablePlans).toHaveBeenCalledWith('AUD');
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('basic');
      expect(result[1].name).toBe('pro');
    });

    it('should default to AUD currency when none specified (edge case)', async () => {
      // Arrange
      const mockPlans: any[] = [];
      mockPlanService.getAvailablePlans.mockResolvedValue(mockPlans);

      // Act
      await subscriptionService.getPlans();

      // Assert
      expect(mockPlanService.getAvailablePlans).toHaveBeenCalledWith('AUD');
    });

    it('should handle service errors gracefully (failure case)', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPlanService.getAvailablePlans.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getPlans('USD')).rejects.toThrow('Database connection failed');
      expect(mockPlanService.getAvailablePlans).toHaveBeenCalledWith('USD');
    });
  });

  describe('createSubscription', () => {
    const validCreateParams: CreateSubscriptionParams = {
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
      const mockSubscriptionDetails: SubscriptionDetails = {
        id: 'sub-123',
        workspaceId: validCreateParams.workspaceId,
        plan: {
          id: validCreateParams.planId,
          name: 'basic',
          displayName: 'Basic Plan',
          pricing: [{ currency: 'AUD', price: 29.99, billingPeriod: 'monthly' }],
          features: { transcription: true },
          quotas: { storage_gb: 10 },
          isActive: true,
          tier: 'basic',
          trialDays: 14
        },
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        currency: 'AUD',
        amount: 29.99,
        paymentGateway: 'eway'
      };

      mockLifecycleService.createSubscription.mockResolvedValue(mockSubscriptionDetails);

      // Act
      const result = await subscriptionService.createSubscription(validCreateParams);

      // Assert
      expect(mockLifecycleService.createSubscription).toHaveBeenCalledWith(validCreateParams);
      expect(result.id).toBe('sub-123');
      expect(result.workspaceId).toBe(validCreateParams.workspaceId);
      expect(result.status).toBe('active');
    });

    it('should handle missing workspace ID (edge case)', async () => {
      // Arrange
      const invalidParams = { ...validCreateParams, workspaceId: '' };
      const error = new Error('Workspace ID is required');
      mockLifecycleService.createSubscription.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.createSubscription(invalidParams)).rejects.toThrow('Workspace ID is required');
    });

    it('should handle payment processing failures (failure case)', async () => {
      // Arrange
      const paymentError = new Error('Payment method declined');
      mockLifecycleService.createSubscription.mockRejectedValue(paymentError);

      // Act & Assert
      await expect(subscriptionService.createSubscription(validCreateParams)).rejects.toThrow('Payment method declined');
      expect(mockLifecycleService.createSubscription).toHaveBeenCalledWith(validCreateParams);
    });
  });

  describe('getWorkspaceSubscription', () => {
    const workspaceId = 'workspace-123';

    it('should retrieve workspace subscription (expected use case)', async () => {
      // Arrange
      const mockSubscription: SubscriptionDetails = {
        id: 'sub-123',
        workspaceId,
        plan: {
          id: 'plan-pro',
          name: 'pro',
          displayName: 'Pro Plan',
          pricing: [{ currency: 'AUD', price: 79.99, billingPeriod: 'monthly' }],
          features: { transcription: true, advancedAnalysis: true },
          quotas: { storage_gb: 50 },
          isActive: true,
          tier: 'pro',
          trialDays: 14
        },
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        currency: 'AUD',
        amount: 79.99,
        paymentGateway: 'eway'
      };

      mockLifecycleService.getWorkspaceSubscription.mockResolvedValue(mockSubscription);

      // Act
      const result = await subscriptionService.getWorkspaceSubscription(workspaceId);

      // Assert
      expect(mockLifecycleService.getWorkspaceSubscription).toHaveBeenCalledWith(workspaceId);
      expect(result?.id).toBe('sub-123');
      expect(result?.workspaceId).toBe(workspaceId);
      expect(result?.plan.name).toBe('pro');
    });

    it('should return null for non-existent subscription (edge case)', async () => {
      // Arrange
      mockLifecycleService.getWorkspaceSubscription.mockResolvedValue(null);

      // Act
      const result = await subscriptionService.getWorkspaceSubscription(workspaceId);

      // Assert
      expect(mockLifecycleService.getWorkspaceSubscription).toHaveBeenCalledWith(workspaceId);
      expect(result).toBeNull();
    });

    it('should handle database query errors (failure case)', async () => {
      // Arrange
      const dbError = new Error('Connection timeout');
      mockLifecycleService.getWorkspaceSubscription.mockRejectedValue(dbError);

      // Act & Assert
      await expect(subscriptionService.getWorkspaceSubscription(workspaceId)).rejects.toThrow('Connection timeout');
    });
  });

  describe('updateSubscriptionPlan', () => {
    const subscriptionId = 'sub-123';
    const newPlanId = 'plan-pro';

    it('should update subscription plan successfully (expected use case)', async () => {
      // Arrange
      const mockUpdatedSubscription: SubscriptionDetails = {
        id: subscriptionId,
        workspaceId: 'workspace-123',
        plan: {
          id: newPlanId,
          name: 'pro',
          displayName: 'Pro Plan',
          pricing: [{ currency: 'AUD', price: 79.99, billingPeriod: 'monthly' }],
          features: { transcription: true, advancedAnalysis: true },
          quotas: { storage_gb: 50 },
          isActive: true,
          tier: 'pro',
          trialDays: 14
        },
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        currency: 'AUD',
        amount: 79.99,
        paymentGateway: 'eway'
      };

      mockLifecycleService.updateSubscriptionPlan.mockResolvedValue(mockUpdatedSubscription);

      // Act
      const result = await subscriptionService.updateSubscriptionPlan(subscriptionId, newPlanId);

      // Assert
      expect(mockLifecycleService.updateSubscriptionPlan).toHaveBeenCalledWith(subscriptionId, newPlanId);
      expect(result.id).toBe(subscriptionId);
      expect(result.plan.id).toBe(newPlanId);
      expect(result.plan.name).toBe('pro');
    });

    it('should handle downgrade to plan with lower limits (edge case)', async () => {
      // Arrange
      const downgradePlanId = 'plan-basic';
      const mockDowngradedSubscription: SubscriptionDetails = {
        id: subscriptionId,
        workspaceId: 'workspace-123',
        plan: {
          id: downgradePlanId,
          name: 'basic',
          displayName: 'Basic Plan',
          pricing: [{ currency: 'AUD', price: 29.99, billingPeriod: 'monthly' }],
          features: { transcription: true },
          quotas: { storage_gb: 10 },
          isActive: true,
          tier: 'basic',
          trialDays: 14
        },
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        currency: 'AUD',
        amount: 29.99,
        paymentGateway: 'eway'
      };

      mockLifecycleService.updateSubscriptionPlan.mockResolvedValue(mockDowngradedSubscription);

      // Act
      const result = await subscriptionService.updateSubscriptionPlan(subscriptionId, downgradePlanId);

      // Assert
      expect(result.plan.id).toBe(downgradePlanId);
      expect(result.plan.quotas.storage_gb).toBe(10);
      expect(result.amount).toBe(29.99);
    });

    it('should handle invalid plan ID (failure case)', async () => {
      // Arrange
      const invalidPlanId = 'plan-nonexistent';
      const error = new Error('Plan not found');
      mockLifecycleService.updateSubscriptionPlan.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.updateSubscriptionPlan(subscriptionId, invalidPlanId)).rejects.toThrow('Plan not found');
    });
  });

  describe('cancelSubscription', () => {
    const subscriptionId = 'sub-123';
    const reason = 'Too expensive';

    it('should cancel subscription successfully (expected use case)', async () => {
      // Arrange
      mockLifecycleService.cancelSubscription.mockResolvedValue(undefined);

      // Act
      await subscriptionService.cancelSubscription(subscriptionId, reason);

      // Assert
      expect(mockLifecycleService.cancelSubscription).toHaveBeenCalledWith(subscriptionId, reason);
    });

    it('should handle cancellation without reason (edge case)', async () => {
      // Arrange
      mockLifecycleService.cancelSubscription.mockResolvedValue(undefined);

      // Act
      await subscriptionService.cancelSubscription(subscriptionId);

      // Assert
      expect(mockLifecycleService.cancelSubscription).toHaveBeenCalledWith(subscriptionId, undefined);
    });

    it('should handle already cancelled subscription (failure case)', async () => {
      // Arrange
      const error = new Error('Subscription is already cancelled');
      mockLifecycleService.cancelSubscription.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.cancelSubscription(subscriptionId, reason)).rejects.toThrow('Subscription is already cancelled');
    });
  });

  describe('getBillingHistory', () => {
    const workspaceId = 'workspace-123';

    it('should retrieve billing history (expected use case)', async () => {
      // Arrange
      const mockBillingHistory = [
        {
          id: 'bill-1',
          amount: 29.99,
          currency: 'AUD',
          status: 'paid',
          invoiceNumber: 'INV-001',
          paidAt: '2024-01-01T00:00:00Z',
          createdAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'bill-2',
          amount: 29.99,
          currency: 'AUD',
          status: 'paid',
          invoiceNumber: 'INV-002',
          paidAt: '2024-02-01T00:00:00Z',
          createdAt: '2024-02-01T00:00:00Z'
        }
      ];

      mockBillingService.getBillingHistory.mockResolvedValue(mockBillingHistory);

      // Act
      const result = await subscriptionService.getBillingHistory(workspaceId, 10);

      // Assert
      expect(mockBillingService.getBillingHistory).toHaveBeenCalledWith(workspaceId, 10);
      expect(result).toHaveLength(2);
      expect(result[0].invoiceNumber).toBe('INV-001');
      expect(result[1].invoiceNumber).toBe('INV-002');
    });

    it('should use default limit when not specified (edge case)', async () => {
      // Arrange
      const mockBillingHistory: any[] = [];
      mockBillingService.getBillingHistory.mockResolvedValue(mockBillingHistory);

      // Act
      await subscriptionService.getBillingHistory(workspaceId);

      // Assert
      expect(mockBillingService.getBillingHistory).toHaveBeenCalledWith(workspaceId, 10);
    });

    it('should handle empty billing history (failure case)', async () => {
      // Arrange
      const error = new Error('No billing records found');
      mockBillingService.getBillingHistory.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getBillingHistory(workspaceId, 5)).rejects.toThrow('No billing records found');
    });
  });

  describe('getCurrentUsage', () => {
    const workspaceId = 'workspace-123';

    it('should retrieve current usage data (expected use case)', async () => {
      // Arrange
      const mockUsageData = {
        subscriptionId: 'sub-123',
        planName: 'Pro Plan',
        currentPeriod: {
          start: '2024-01-01T00:00:00Z',
          end: '2024-02-01T00:00:00Z'
        },
        usage: {
          transcription_minutes: { quantity: 450, cost: 22.5 },
          storage_gb: { quantity: 25.3, cost: 0.0 }
        },
        quotas: {
          transcription_minutes: 1000,
          storage_gb: 50
        },
        totalCost: 22.5
      };

      mockBillingService.getCurrentUsage.mockResolvedValue(mockUsageData);

      // Act
      const result = await subscriptionService.getCurrentUsage(workspaceId);

      // Assert
      expect(mockBillingService.getCurrentUsage).toHaveBeenCalledWith(workspaceId);
      expect(result.subscriptionId).toBe('sub-123');
      expect(result.usage.transcription_minutes.quantity).toBe(450);
      expect(result.quotas.transcription_minutes).toBe(1000);
      expect(result.totalCost).toBe(22.5);
    });

    it('should handle workspace without subscription (edge case)', async () => {
      // Arrange
      const error = new Error('No active subscription found');
      mockBillingService.getCurrentUsage.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getCurrentUsage(workspaceId)).rejects.toThrow('No active subscription found');
    });

    it('should handle usage calculation errors (failure case)', async () => {
      // Arrange
      const error = new Error('Failed to calculate usage metrics');
      mockBillingService.getCurrentUsage.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getCurrentUsage(workspaceId)).rejects.toThrow('Failed to calculate usage metrics');
    });
  });

  describe('utility methods', () => {
    describe('getUsagePercentage', () => {
      it('should calculate usage percentage correctly (expected use case)', () => {
        // Act & Assert
        expect(subscriptionService.getUsagePercentage(25, 100)).toBe(25);
        expect(subscriptionService.getUsagePercentage(75, 100)).toBe(75);
        expect(subscriptionService.getUsagePercentage(100, 100)).toBe(100);
      });

      it('should handle zero limit (edge case)', () => {
        // Act & Assert
        expect(subscriptionService.getUsagePercentage(50, 0)).toBe(0);
      });

      it('should handle usage exceeding limit (edge case)', () => {
        // Act & Assert
        expect(subscriptionService.getUsagePercentage(150, 100)).toBe(150);
      });
    });

    describe('getUsageStatusColor', () => {
      it('should return correct colors for different percentages (expected use case)', () => {
        // Act & Assert
        expect(subscriptionService.getUsageStatusColor(25)).toBe('green');
        expect(subscriptionService.getUsageStatusColor(60)).toBe('yellow');
        expect(subscriptionService.getUsageStatusColor(80)).toBe('orange');
        expect(subscriptionService.getUsageStatusColor(95)).toBe('red');
      });

      it('should handle edge cases at boundaries', () => {
        // Act & Assert
        expect(subscriptionService.getUsageStatusColor(49)).toBe('green');
        expect(subscriptionService.getUsageStatusColor(50)).toBe('yellow');
        expect(subscriptionService.getUsageStatusColor(74)).toBe('yellow');
        expect(subscriptionService.getUsageStatusColor(75)).toBe('orange');
        expect(subscriptionService.getUsageStatusColor(89)).toBe('orange');
        expect(subscriptionService.getUsageStatusColor(90)).toBe('red');
      });
    });
  });
});