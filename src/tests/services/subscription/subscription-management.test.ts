import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService } from '../../../services/subscription';
import * as apiModule from '../../../services/api';

/**
 * Tests for subscription management functionality
 */

vi.mock('../../../services/api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedApiModule = vi.mocked(apiModule);

describe('SubscriptionService - Management', () => {
  let subscriptionService: SubscriptionService;
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    (mockedApiModule.apiClient as any) = mockApiClient;
    subscriptionService = new SubscriptionService();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub-123',
        planId: 'plan-1',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date()
      };
      
      mockApiClient.post.mockResolvedValueOnce({ data: mockSubscription });
      
      const result = await subscriptionService.createSubscription('plan-1', 'pm_123');
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/subscription', {
        planId: 'plan-1',
        paymentMethodId: 'pm_123'
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should handle subscription creation with trial', async () => {
      const mockSubscription = {
        id: 'sub-123',
        planId: 'plan-1',
        status: 'trialing',
        trialEnd: new Date()
      };
      
      mockApiClient.post.mockResolvedValueOnce({ data: mockSubscription });
      
      const result = await subscriptionService.createSubscription('plan-1', 'pm_123', true);
      
      expect(mockApiClient.post).toHaveBeenCalledWith('/subscription', {
        planId: 'plan-1',
        paymentMethodId: 'pm_123',
        trial: true
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw error when subscription creation fails', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Payment failed'));
      
      await expect(subscriptionService.createSubscription('plan-1', 'pm_123'))
        .rejects.toThrow('Failed to create subscription');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription plan successfully', async () => {
      const mockUpdatedSubscription = {
        id: 'sub-123',
        planId: 'plan-2',
        status: 'active'
      };
      
      mockApiClient.put.mockResolvedValueOnce({ data: mockUpdatedSubscription });
      
      const result = await subscriptionService.updateSubscription('sub-123', { planId: 'plan-2' });
      
      expect(mockApiClient.put).toHaveBeenCalledWith('/subscription/sub-123', {
        planId: 'plan-2'
      });
      expect(result).toEqual(mockUpdatedSubscription);
    });

    it('should handle empty update data', async () => {
      mockApiClient.put.mockResolvedValueOnce({ data: { id: 'sub-123' } });
      
      const result = await subscriptionService.updateSubscription('sub-123', {});
      
      expect(mockApiClient.put).toHaveBeenCalledWith('/subscription/sub-123', {});
    });

    it('should throw error when update fails', async () => {
      mockApiClient.put.mockRejectedValueOnce(new Error('Update failed'));
      
      await expect(subscriptionService.updateSubscription('sub-123', { planId: 'plan-2' }))
        .rejects.toThrow('Failed to update subscription');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const mockCancelledSubscription = {
        id: 'sub-123',
        status: 'canceled',
        canceledAt: new Date()
      };
      
      mockApiClient.delete.mockResolvedValueOnce({ data: mockCancelledSubscription });
      
      const result = await subscriptionService.cancelSubscription('sub-123');
      
      expect(mockApiClient.delete).toHaveBeenCalledWith('/subscription/sub-123');
      expect(result).toEqual(mockCancelledSubscription);
    });

    it('should handle immediate cancellation', async () => {
      const mockCancelledSubscription = {
        id: 'sub-123',
        status: 'canceled',
        canceledAt: new Date()
      };
      
      mockApiClient.delete.mockResolvedValueOnce({ data: mockCancelledSubscription });
      
      const result = await subscriptionService.cancelSubscription('sub-123', true);
      
      expect(mockApiClient.delete).toHaveBeenCalledWith('/subscription/sub-123?immediate=true');
    });

    it('should throw error when cancellation fails', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new Error('Cancellation failed'));
      
      await expect(subscriptionService.cancelSubscription('sub-123'))
        .rejects.toThrow('Failed to cancel subscription');
    });
  });
});