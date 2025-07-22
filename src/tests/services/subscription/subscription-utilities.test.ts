import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService } from '../../../services/subscription';
import * as apiModule from '../../../services/api';

/**
 * Tests for subscription utility methods
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

describe('SubscriptionService - Utilities', () => {
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

  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      const result = subscriptionService.formatCurrency(29.99, 'USD');
      expect(result).toBe('$29.99');
    });

    it('should format EUR currency correctly', () => {
      const result = subscriptionService.formatCurrency(29.99, 'EUR');
      expect(result).toBe('€29.99');
    });

    it('should handle zero amount', () => {
      const result = subscriptionService.formatCurrency(0, 'USD');
      expect(result).toBe('$0.00');
    });

    it('should handle unknown currency', () => {
      const result = subscriptionService.formatCurrency(29.99, 'XYZ');
      expect(result).toBe('XYZ29.99');
    });
  });

  describe('getPlanFeatures', () => {
    it('should return features for Free plan', () => {
      const features = subscriptionService.getPlanFeatures('free');
      expect(features).toContain('10 minutes/month');
      expect(features).toContain('Basic support');
    });

    it('should return features for Pro plan', () => {
      const features = subscriptionService.getPlanFeatures('pro');
      expect(features).toContain('Unlimited transcription');
      expect(features).toContain('Priority support');
    });

    it('should return empty array for unknown plan', () => {
      const features = subscriptionService.getPlanFeatures('unknown');
      expect(features).toEqual([]);
    });
  });

  describe('getStatusBadge', () => {
    it('should return correct badge for active status', () => {
      const badge = subscriptionService.getStatusBadge('active');
      expect(badge).toEqual({
        text: 'Active',
        variant: 'success'
      });
    });

    it('should return correct badge for canceled status', () => {
      const badge = subscriptionService.getStatusBadge('canceled');
      expect(badge).toEqual({
        text: 'Canceled',
        variant: 'danger'
      });
    });

    it('should return correct badge for trialing status', () => {
      const badge = subscriptionService.getStatusBadge('trialing');
      expect(badge).toEqual({
        text: 'Trial',
        variant: 'info'
      });
    });

    it('should return default badge for unknown status', () => {
      const badge = subscriptionService.getStatusBadge('unknown');
      expect(badge).toEqual({
        text: 'Unknown',
        variant: 'secondary'
      });
    });
  });

  describe('getDaysUntilTrialEnd', () => {
    it('should calculate days until trial end correctly', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 14);
      
      const days = subscriptionService.getDaysUntilTrialEnd(futureDate);
      expect(days).toBe(14);
    });

    it('should return 0 for past trial end date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      
      const days = subscriptionService.getDaysUntilTrialEnd(pastDate);
      expect(days).toBe(0);
    });

    it('should handle null trial end date', () => {
      const days = subscriptionService.getDaysUntilTrialEnd(null);
      expect(days).toBe(0);
    });
  });
});