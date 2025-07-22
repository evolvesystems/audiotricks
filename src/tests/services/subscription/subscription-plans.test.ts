import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SubscriptionService } from '../../../services/subscription';
import * as apiModule from '../../../services/api';

/**
 * Tests for subscription plans functionality
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

describe('SubscriptionService - Plans', () => {
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

  describe('getPlans', () => {
    it('should fetch and return subscription plans successfully', async () => {
      const mockPlans = [
        {
          id: 'plan-1',
          name: 'Free',
          displayName: 'Free Plan',
          price: 0,
          currency: 'USD',
          interval: 'month',
          features: ['10 minutes/month', 'Basic support']
        }
      ];
      
      mockApiClient.get.mockResolvedValueOnce({ data: mockPlans });
      
      const result = await subscriptionService.getPlans();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/subscription/plans');
      expect(result).toEqual(mockPlans);
    });

    it('should handle empty plans response', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [] });
      
      const result = await subscriptionService.getPlans();
      
      expect(result).toEqual([]);
    });

    it('should throw error when API call fails', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));
      
      await expect(subscriptionService.getPlans()).rejects.toThrow('Failed to fetch subscription plans');
    });
  });

  describe('getCurrencies', () => {
    it('should fetch and return supported currencies', async () => {
      const mockCurrencies = [
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' }
      ];
      
      mockApiClient.get.mockResolvedValueOnce({ data: mockCurrencies });
      
      const result = await subscriptionService.getCurrencies();
      
      expect(mockApiClient.get).toHaveBeenCalledWith('/subscription/currencies');
      expect(result).toEqual(mockCurrencies);
    });

    it('should handle empty currencies response', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: [] });
      
      const result = await subscriptionService.getCurrencies();
      
      expect(result).toEqual([]);
    });

    it('should throw error when currencies API fails', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('Currency API Error'));
      
      await expect(subscriptionService.getCurrencies()).rejects.toThrow('Failed to fetch currencies');
    });
  });
});