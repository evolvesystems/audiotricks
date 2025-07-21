import { PlanService, SubscriptionPlan } from './plan.service';
import { BillingService, BillingRecord, UsageData, RecordUsageParams } from './billing.service';
import { SubscriptionLifecycleService, CreateSubscriptionParams, SubscriptionDetails } from './subscription-lifecycle.service';

/**
 * Main SubscriptionService that orchestrates plan, billing, and lifecycle services
 * This is the public API that controllers and other services should use
 */
export class SubscriptionService {
  private planService: PlanService;
  private billingService: BillingService;
  private lifecycleService: SubscriptionLifecycleService;

  constructor() {
    this.planService = new PlanService();
    this.billingService = new BillingService();
    this.lifecycleService = new SubscriptionLifecycleService();
  }

  // Plan Management Methods
  async getPlans(currency: string = 'AUD'): Promise<SubscriptionPlan[]> {
    return this.planService.getAvailablePlans(currency);
  }

  async getCurrencies(): Promise<any[]> {
    return this.planService.getSupportedCurrencies();
  }

  getPlanFeatures(plan: SubscriptionPlan): string[] {
    return this.planService.getPlanFeatures(plan);
  }

  getPlanQuotas(plan: SubscriptionPlan): Record<string, string> {
    return this.planService.getPlanQuotas(plan);
  }

  formatCurrency(amount: number, currency: string): string {
    return this.planService.formatCurrency(amount, currency);
  }

  // Subscription Lifecycle Methods
  async createSubscription(params: CreateSubscriptionParams): Promise<SubscriptionDetails> {
    return this.lifecycleService.createSubscription(params);
  }

  async getSubscription(workspaceId: string): Promise<SubscriptionDetails | null> {
    return this.lifecycleService.getWorkspaceSubscription(workspaceId);
  }

  async getWorkspaceSubscription(workspaceId: string): Promise<SubscriptionDetails | null> {
    return this.lifecycleService.getWorkspaceSubscription(workspaceId);
  }

  async getAvailablePlans(currency: string = 'AUD'): Promise<SubscriptionPlan[]> {
    return this.planService.getAvailablePlans(currency);
  }

  async updateSubscriptionPlan(subscriptionId: string, newPlanId: string): Promise<SubscriptionDetails> {
    return this.lifecycleService.updateSubscriptionPlan(subscriptionId, newPlanId);
  }

  async cancelSubscription(subscriptionId: string, reason?: string): Promise<void> {
    return this.lifecycleService.cancelSubscription(subscriptionId, reason);
  }

  getStatusBadge(status: string): { text: string; color: string } {
    return this.lifecycleService.getStatusBadge(status);
  }

  getDaysUntilTrialEnd(trialEnd: Date): number {
    return this.lifecycleService.getDaysUntilTrialEnd(trialEnd);
  }

  // Billing and Usage Methods
  async getBillingHistory(workspaceId: string, limit: number = 10): Promise<BillingRecord[]> {
    return this.billingService.getBillingHistory(workspaceId, limit);
  }

  async getCurrentUsage(workspaceId: string): Promise<UsageData> {
    return this.billingService.getCurrentUsage(workspaceId);
  }

  async recordUsage(params: RecordUsageParams): Promise<void> {
    return this.billingService.recordUsage(params);
  }

  async getWorkspaceLimits(workspaceId: string): Promise<Record<string, number>> {
    return this.billingService.getWorkspaceLimits(workspaceId);
  }

  async hasActiveSubscription(workspaceId: string): Promise<boolean> {
    return this.billingService.hasActiveSubscription(workspaceId);
  }

  // Utility Methods
  getUsagePercentage(used: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.round((used / limit) * 100);
  }

  getUsageStatusColor(percentage: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  }
}

// Re-export types for convenience
export type { 
  SubscriptionPlan, 
  CreateSubscriptionParams, 
  SubscriptionDetails, 
  BillingRecord, 
  UsageData, 
  RecordUsageParams 
};

// Re-export Currency type
export type { Currency } from './plan.service';