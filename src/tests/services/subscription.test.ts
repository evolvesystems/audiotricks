import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService, SubscriptionPlan, SubscriptionDetails } from '../../services/subscription';
import * as apiModule from '../../services/api';

/**
 * Comprehensive tests for frontend SubscriptionService
 * Following CLAUDE.md requirements: Expected use case, Edge case, Failure case
 */

// Mock apiClient from api module
vi.mock('../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiModule = vi.mocked(apiModule);

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let mockApiClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Set up mocked apiClient
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    // Cast the mocked apiClient
    (mockedApiModule.apiClient as any) = mockApiClient;

    subscriptionService = new SubscriptionService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPlans', () => {
    const mockPlans: SubscriptionPlan[] = [
      {
        id: 'plan-basic',
        name: 'basic',
        displayName: 'Basic Plan',
        tier: 'basic',
        features: { transcription: true, basicAnalysis: true },
        quotas: { storage_gb: 10, transcription_minutes: 300 },
        pricing: [{ currency: 'USD', price: 19.99, billingPeriod: 'monthly' }],
        trialDays: 14,
        isActive: true,
      },
      {
        id: 'plan-pro',
        name: 'pro',
        displayName: 'Pro Plan',
        tier: 'pro',
        features: { transcription: true, basicAnalysis: true, advancedAnalysis: true },
        quotas: { storage_gb: 50, transcription_minutes: 1000 },
        pricing: [{ currency: 'USD', price: 49.99, billingPeriod: 'monthly' }],
        trialDays: 14,
        isActive: true,
      },
    ];

    it('should fetch subscription plans successfully (expected use case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ plans: mockPlans });

      // Act
      const result = await subscriptionService.getPlans('USD');

      // Assert
      expect(result).toEqual(mockPlans);
      expect(mockApiClient.get).toHaveBeenCalledWith('/payment/plans?currency=USD');
    });

    it('should handle region parameter (edge case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ plans: mockPlans });

      // Act
      await subscriptionService.getPlans('EUR', 'Europe');

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/payment/plans?currency=EUR&region=Europe');
    });

    it('should use default currency when not specified (edge case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ plans: mockPlans });

      // Act
      await subscriptionService.getPlans();

      // Assert
      expect(mockApiClient.get).toHaveBeenCalledWith('/payment/plans?currency=USD');
    });

    it('should handle API errors (failure case)', async () => {
      // Arrange
      const error = new Error('Failed to fetch plans');
      mockApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getPlans('USD')).rejects.toThrow('Failed to fetch plans');
    });
  });

  describe('getCurrencies', () => {
    const mockCurrencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, lastUpdated: '2024-01-01T00:00:00Z' },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.45, lastUpdated: '2024-01-01T00:00:00Z' },
    ];

    it('should fetch supported currencies successfully (expected use case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ currencies: mockCurrencies });

      // Act
      const result = await subscriptionService.getCurrencies();

      // Assert
      expect(result).toEqual(mockCurrencies);
      expect(mockApiClient.get).toHaveBeenCalledWith('/payment/currencies');
    });

    it('should handle empty currency list (edge case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ currencies: [] });

      // Act
      const result = await subscriptionService.getCurrencies();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle API errors (failure case)', async () => {
      // Arrange
      const error = new Error('Currency service unavailable');
      mockApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getCurrencies()).rejects.toThrow('Currency service unavailable');
    });
  });

  describe('createSetupIntent', () => {
    const workspaceId = 'workspace-123';

    it('should create setup intent successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = {
        clientSecret: 'pi_test_123_secret',
        customerId: 'cus_test_456',
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      // Act
      const result = await subscriptionService.createSetupIntent(workspaceId);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/payment/workspaces/${workspaceId}/setup-intent`,
        {}
      );
    });

    it('should handle workspace validation errors (edge case)', async () => {
      // Arrange
      const error = new Error('Workspace not found');
      mockApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.createSetupIntent('invalid-workspace')).rejects.toThrow('Workspace not found');
    });

    it('should handle payment processor errors (failure case)', async () => {
      // Arrange
      const error = new Error('Payment processor temporarily unavailable');
      mockApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.createSetupIntent(workspaceId)).rejects.toThrow('Payment processor temporarily unavailable');
    });
  });

  describe('createSubscription', () => {
    const subscriptionParams = {
      workspaceId: 'workspace-123',
      planId: 'plan-pro',
      paymentMethodId: 'pm_test_456',
      currency: 'USD',
    };

    const mockSubscriptionDetails: SubscriptionDetails = {
      id: 'sub-123',
      workspaceId: subscriptionParams.workspaceId,
      plan: {
        id: subscriptionParams.planId,
        name: 'pro',
        displayName: 'Pro Plan',
        tier: 'pro',
        features: { transcription: true, advancedAnalysis: true },
        quotas: { storage_gb: 50 },
        pricing: [{ currency: 'USD', price: 49.99, billingPeriod: 'monthly' }],
        trialDays: 14,
        isActive: true,
      },
      status: 'active',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      currency: 'USD',
      amount: 49.99,
      paymentGateway: 'stripe',
    };

    it('should create subscription successfully (expected use case)', async () => {
      // Arrange
      mockApiClient.post.mockResolvedValue({ subscription: mockSubscriptionDetails });

      // Act
      const result = await subscriptionService.createSubscription(subscriptionParams);

      // Assert
      expect(result).toEqual(mockSubscriptionDetails);
      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/payment/workspaces/${subscriptionParams.workspaceId}/subscription`,
        {
          planId: subscriptionParams.planId,
          paymentMethodId: subscriptionParams.paymentMethodId,
          currency: subscriptionParams.currency,
        }
      );
    });

    it('should use default currency when not specified (edge case)', async () => {
      // Arrange
      const paramsWithoutCurrency = { ...subscriptionParams };
      delete (paramsWithoutCurrency as any).currency;
      mockApiClient.post.mockResolvedValue({ subscription: mockSubscriptionDetails });

      // Act
      await subscriptionService.createSubscription(paramsWithoutCurrency);

      // Assert
      expect(mockApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ currency: 'USD' })
      );
    });

    it('should handle payment method declined (failure case)', async () => {
      // Arrange
      const error = new Error('Payment method declined');
      mockApiClient.post.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.createSubscription(subscriptionParams)).rejects.toThrow('Payment method declined');
    });
  });

  describe('getSubscription', () => {
    const workspaceId = 'workspace-123';
    const mockSubscription: SubscriptionDetails = {
      id: 'sub-123',
      workspaceId,
      plan: {
        id: 'plan-basic',
        name: 'basic',
        displayName: 'Basic Plan',
        tier: 'basic',
        features: { transcription: true },
        quotas: { storage_gb: 10 },
        pricing: [{ currency: 'USD', price: 19.99, billingPeriod: 'monthly' }],
        trialDays: 14,
        isActive: true,
      },
      status: 'active',
      currentPeriodStart: '2024-01-01T00:00:00Z',
      currentPeriodEnd: '2024-02-01T00:00:00Z',
      currency: 'USD',
      amount: 19.99,
      paymentGateway: 'stripe',
    };

    it('should retrieve workspace subscription successfully (expected use case)', async () => {
      // Arrange
      mockApiClient.get.mockResolvedValue({ subscription: mockSubscription });

      // Act
      const result = await subscriptionService.getSubscription(workspaceId);

      // Assert
      expect(result).toEqual(mockSubscription);
      expect(mockApiClient.get).toHaveBeenCalledWith(`/payment/workspaces/${workspaceId}/subscription`);
    });

    it('should return null for non-existent subscription (edge case)', async () => {
      // Arrange
      const notFoundError = new Error('Not found');
      (notFoundError as any).status = 404;
      mockApiClient.get.mockRejectedValue(notFoundError);

      // Act
      const result = await subscriptionService.getSubscription(workspaceId);

      // Assert
      expect(result).toBeNull();
    });

    it('should throw for other API errors (failure case)', async () => {
      // Arrange
      const error = new Error('Server error');
      (error as any).status = 500;
      mockApiClient.get.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.getSubscription(workspaceId)).rejects.toThrow('Server error');
    });
  });

  describe('updateSubscription', () => {
    const workspaceId = 'workspace-123';
    const newPlanId = 'plan-enterprise';

    it('should update subscription plan successfully (expected use case)', async () => {
      // Arrange
      const updatedSubscription = {
        id: 'sub-123',
        plan: { id: newPlanId, name: 'enterprise' },
      };
      mockApiClient.put.mockResolvedValue({ subscription: updatedSubscription });

      // Act
      const result = await subscriptionService.updateSubscription(workspaceId, newPlanId);

      // Assert
      expect(result).toEqual(updatedSubscription);
      expect(mockApiClient.put).toHaveBeenCalledWith(
        `/payment/workspaces/${workspaceId}/subscription`,
        { planId: newPlanId }
      );
    });

    it('should handle invalid plan ID (edge case)', async () => {
      // Arrange
      const error = new Error('Plan not found');
      mockApiClient.put.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.updateSubscription(workspaceId, 'invalid-plan')).rejects.toThrow('Plan not found');
    });

    it('should handle billing failures (failure case)', async () => {
      // Arrange
      const error = new Error('Payment required');
      mockApiClient.put.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.updateSubscription(workspaceId, newPlanId)).rejects.toThrow('Payment required');
    });
  });

  describe('cancelSubscription', () => {
    const workspaceId = 'workspace-123';
    const reason = 'No longer needed';

    it('should cancel subscription successfully (expected use case)', async () => {
      // Arrange
      mockApiClient.delete.mockResolvedValue({});

      // Act
      await subscriptionService.cancelSubscription(workspaceId, reason);

      // Assert
      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/payment/workspaces/${workspaceId}/subscription`
      );
    });

    it('should handle cancellation without reason (edge case)', async () => {
      // Arrange
      mockApiClient.delete.mockResolvedValue({});

      // Act
      await subscriptionService.cancelSubscription(workspaceId);

      // Assert
      expect(mockApiClient.delete).toHaveBeenCalledWith(
        `/payment/workspaces/${workspaceId}/subscription`
      );
    });

    it('should handle already cancelled subscription (failure case)', async () => {
      // Arrange
      const error = new Error('Subscription already cancelled');
      mockApiClient.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.cancelSubscription(workspaceId, reason)).rejects.toThrow('Subscription already cancelled');
    });
  });

  describe('utility methods', () => {
    describe('formatCurrency', () => {
      it('should format currency correctly for different locales (expected use case)', () => {
        // Act & Assert
        expect(subscriptionService.formatCurrency(19.99, 'USD')).toBe('$19.99');
        expect(subscriptionService.formatCurrency(29.99, 'EUR', 'de-DE')).toBe('29,99\u00A0€');
        expect(subscriptionService.formatCurrency(1000, 'JPY')).toBe('¥1,000');
      });

      it('should handle special currencies without decimals (edge case)', () => {
        // Act & Assert
        expect(subscriptionService.formatCurrency(1000, 'JPY')).toBe('¥1,000');
        expect(subscriptionService.formatCurrency(50000, 'KRW')).toBe('₩50,000');
      });

      it('should fallback to simple format for invalid currencies (failure case)', () => {
        // Act & Assert
        expect(subscriptionService.formatCurrency(19.99, 'INVALID')).toBe('19.99 INVALID');
      });
    });

    describe('getPlanFeatures', () => {
      const mockPlan: SubscriptionPlan = {
        id: 'plan-test',
        name: 'test',
        displayName: 'Test Plan',
        tier: 'test',
        features: {
          transcription: true,
          advancedAnalysis: true,
          export: ['pdf', 'docx'],
          apiAccess: false,
        },
        quotas: {},
        pricing: [],
        trialDays: 0,
        isActive: true,
      };

      it('should extract and format plan features correctly (expected use case)', () => {
        // Act
        const features = subscriptionService.getPlanFeatures(mockPlan);

        // Assert
        expect(features).toContain('Audio transcription');
        expect(features).toContain('Advanced analytics');
        expect(features).toContain('Export formats: PDF, DOCX');
        expect(features).not.toContain('Full API access'); // apiAccess is false
      });

      it('should handle plans with no features (edge case)', () => {
        // Arrange
        const planWithNoFeatures = { ...mockPlan, features: {} };

        // Act
        const features = subscriptionService.getPlanFeatures(planWithNoFeatures);

        // Assert
        expect(features).toEqual([]);
      });

      it('should handle malformed feature data gracefully (failure case)', () => {
        // Arrange
        const planWithMalformedFeatures = {
          ...mockPlan,
          features: {
            transcription: 'invalid', // Should be boolean
            export: null, // Should be array
          },
        };

        // Act
        const features = subscriptionService.getPlanFeatures(planWithMalformedFeatures as any);

        // Assert
        expect(Array.isArray(features)).toBe(true);
        expect(features.length).toBe(0); // No valid features
      });
    });

    describe('getStatusBadge', () => {
      it('should return correct status information for all statuses (expected use case)', () => {
        // Act & Assert
        expect(subscriptionService.getStatusBadge('active')).toEqual({
          color: 'green',
          text: 'Active',
          description: 'Your subscription is active and billing normally',
        });

        expect(subscriptionService.getStatusBadge('trialing')).toEqual({
          color: 'blue',
          text: 'Trial',
          description: 'You are currently in your free trial period',
        });

        expect(subscriptionService.getStatusBadge('past_due')).toEqual({
          color: 'orange',
          text: 'Past Due',
          description: 'Payment failed, please update your payment method',
        });
      });

      it('should handle unknown status (edge case)', () => {
        // Act
        const result = subscriptionService.getStatusBadge('unknown_status');

        // Assert
        expect(result).toEqual({
          color: 'gray',
          text: 'Unknown',
          description: 'Subscription status unknown',
        });
      });
    });

    describe('getDaysUntilTrialEnd', () => {
      it('should calculate days correctly for future dates (expected use case)', () => {
        // Arrange
        const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
        const trialEndString = futureDate.toISOString();

        // Act
        const days = subscriptionService.getDaysUntilTrialEnd(trialEndString);

        // Assert
        expect(days).toBe(7);
      });

      it('should return 0 for past dates (edge case)', () => {
        // Arrange
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        const trialEndString = pastDate.toISOString();

        // Act
        const days = subscriptionService.getDaysUntilTrialEnd(trialEndString);

        // Assert
        expect(days).toBe(0);
      });

      it('should handle invalid date strings gracefully (failure case)', () => {
        // Act & Assert
        expect(() => subscriptionService.getDaysUntilTrialEnd('invalid-date')).not.toThrow();
      });
    });
  });
});