import { ApiService } from './api';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: string;
  features: Record<string, any>;
  quotas: Record<string, any>;
  pricing: {
    currency: string;
    price: number;
    billingPeriod: string;
  }[];
  trialDays: number;
  isActive: boolean;
}

export interface SubscriptionDetails {
  id: string;
  workspaceId: string;
  plan: SubscriptionPlan;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelledAt?: string;
  currency: string;
  amount: number;
  paymentGateway: string;
  nextInvoice?: {
    amount: number;
    date: string;
  };
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  lastUpdated: string;
}

export interface BillingRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  failureReason?: string;
}

export interface UsageData {
  subscriptionId: string;
  planName: string;
  currentPeriod: {
    start: string;
    end: string;
  };
  usage: Record<string, { quantity: number; cost: number }>;
  quotas: Record<string, any>;
  totalCost: number;
}

export interface ConversionResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  convertedAmount: number;
  rate: number;
  timestamp: string;
}

/**
 * Subscription service for managing payments and billing
 */
export class SubscriptionService extends ApiService {
  /**
   * Get available subscription plans
   */
  async getPlans(currency = 'USD', region?: string): Promise<SubscriptionPlan[]> {
    const params = new URLSearchParams({ currency });
    if (region) params.append('region', region);

    const response = await this.get(`/payment/plans?${params}`);
    return response.plans;
  }

  /**
   * Get supported currencies
   */
  async getCurrencies(): Promise<Currency[]> {
    const response = await this.get('/payment/currencies');
    return response.currencies;
  }

  /**
   * Create payment setup intent
   */
  async createSetupIntent(workspaceId: string): Promise<{ clientSecret: string; customerId: string }> {
    return await this.post(`/payment/workspaces/${workspaceId}/setup-intent`, {});
  }

  /**
   * Create subscription
   */
  async createSubscription(params: {
    workspaceId: string;
    planId: string;
    paymentMethodId: string;
    currency?: string;
  }): Promise<SubscriptionDetails> {
    const response = await this.post(`/payment/workspaces/${params.workspaceId}/subscription`, {
      planId: params.planId,
      paymentMethodId: params.paymentMethodId,
      currency: params.currency || 'USD'
    });
    return response.subscription;
  }

  /**
   * Get workspace subscription
   */
  async getSubscription(workspaceId: string): Promise<SubscriptionDetails | null> {
    try {
      const response = await this.get(`/payment/workspaces/${workspaceId}/subscription`);
      return response.subscription;
    } catch (error: any) {
      if (error.status === 404) {
        return null; // No subscription found
      }
      throw error;
    }
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(workspaceId: string, planId: string): Promise<SubscriptionDetails> {
    const response = await this.put(`/payment/workspaces/${workspaceId}/subscription`, {
      planId
    });
    return response.subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(workspaceId: string, reason?: string): Promise<void> {
    await this.delete(`/payment/workspaces/${workspaceId}/subscription`, {
      reason
    });
  }

  /**
   * Get billing history
   */
  async getBillingHistory(workspaceId: string, limit = 10): Promise<BillingRecord[]> {
    const response = await this.get(`/payment/workspaces/${workspaceId}/billing?limit=${limit}`);
    return response.billingHistory;
  }

  /**
   * Get current usage
   */
  async getCurrentUsage(workspaceId: string): Promise<UsageData> {
    const response = await this.get(`/payment/workspaces/${workspaceId}/usage`);
    return response.usage;
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(workspaceId: string): Promise<any[]> {
    const response = await this.get(`/payment/workspaces/${workspaceId}/payment-methods`);
    return response.paymentMethods;
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<ConversionResult> {
    const params = new URLSearchParams({
      amount: amount.toString(),
      fromCurrency,
      toCurrency
    });

    const response = await this.get(`/payment/convert?${params}`);
    return response.conversion;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string, locale = 'en-US'): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.toUpperCase(),
        minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2,
        maximumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
      }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  }

  /**
   * Get plan features as formatted list
   */
  getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features: string[] = [];
    const featureMap: Record<string, string> = {
      transcription: 'Audio transcription',
      summarization: 'AI-powered summaries',
      basicAnalysis: 'Basic audio analysis',
      advancedAnalysis: 'Advanced analytics',
      apiAccess: 'Full API access',
      prioritySupport: 'Priority support',
      customIntegrations: 'Custom integrations',
      teamWorkspaces: 'Team collaboration',
      advancedAnalytics: 'Advanced analytics dashboard',
      customBranding: 'Custom branding',
      speakerIdentification: 'Speaker identification',
      sentimentAnalysis: 'Sentiment analysis',
      keywordExtraction: 'Keyword extraction',
      automatedSummaries: 'Automated summaries',
      customAiModels: 'Custom AI models',
      ssoIntegration: 'SSO integration',
      auditLogs: 'Audit logs',
      dataRetention: 'Extended data retention',
      dedicatedSupport: 'Dedicated support'
    };

    Object.entries(plan.features).forEach(([key, value]) => {
      if (value === true && featureMap[key]) {
        features.push(featureMap[key]);
      } else if (Array.isArray(value) && value.length > 0) {
        if (key === 'export') {
          features.push(`Export formats: ${value.join(', ').toUpperCase()}`);
        }
      }
    });

    return features;
  }

  /**
   * Get plan quota limits as formatted list
   */
  getPlanQuotas(plan: SubscriptionPlan): Record<string, string> {
    const quotas: Record<string, string> = {};
    const quotaMap: Record<string, string> = {
      storage_gb: 'Storage',
      processing_minutes: 'Processing time per month',
      api_calls_per_month: 'API calls per month',
      transcription_minutes: 'Transcription minutes per month',
      ai_tokens_per_month: 'AI tokens per month',
      workspaces: 'Workspaces',
      team_members: 'Team members'
    };

    Object.entries(plan.quotas).forEach(([key, value]) => {
      if (quotaMap[key]) {
        let formattedValue: string;
        
        if (key === 'storage_gb') {
          formattedValue = `${value} GB`;
        } else if (key.includes('minutes')) {
          formattedValue = `${value} minutes`;
        } else if (key.includes('per_month')) {
          formattedValue = value.toLocaleString();
        } else {
          formattedValue = value.toString();
        }

        quotas[quotaMap[key]] = formattedValue;
      }
    });

    return quotas;
  }

  /**
   * Check if plan has feature
   */
  hasPlanFeature(plan: SubscriptionPlan, feature: string): boolean {
    return !!plan.features[feature];
  }

  /**
   * Get subscription status badge info
   */
  getStatusBadge(status: string): { color: string; text: string; description: string } {
    const statusMap: Record<string, { color: string; text: string; description: string }> = {
      active: {
        color: 'green',
        text: 'Active',
        description: 'Your subscription is active and billing normally'
      },
      trialing: {
        color: 'blue',
        text: 'Trial',
        description: 'You are currently in your free trial period'
      },
      past_due: {
        color: 'orange',
        text: 'Past Due',
        description: 'Payment failed, please update your payment method'
      },
      cancelled: {
        color: 'red',
        text: 'Cancelled',
        description: 'Your subscription has been cancelled'
      },
      expired: {
        color: 'gray',
        text: 'Expired',
        description: 'Your subscription has expired'
      }
    };

    return statusMap[status] || {
      color: 'gray',
      text: 'Unknown',
      description: 'Subscription status unknown'
    };
  }

  /**
   * Calculate days until trial ends
   */
  getDaysUntilTrialEnd(trialEnd: string): number {
    const trialEndDate = new Date(trialEnd);
    const now = new Date();
    const diffTime = trialEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calculate usage percentage
   */
  getUsagePercentage(used: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  /**
   * Get usage status color
   */
  getUsageStatusColor(percentage: number): string {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  }
}