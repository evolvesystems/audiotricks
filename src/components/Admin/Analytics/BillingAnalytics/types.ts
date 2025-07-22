/**
 * Type definitions for billing analytics components
 */

export interface BillingAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  subscriptionStats: Array<{
    status: string;
    _count: { status: number };
  }>;
  planDistribution: Array<{
    subscriptionPlanId: string;
    _count: { subscriptionPlanId: number };
    subscriptionPlan?: { name: string; tier: string };
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    workspace: { name: string };
  }>;
}

export interface UsageAnalytics {
  totalUsage: Array<{
    metricType: string;
    _sum: { value: number };
  }>;
  weeklyUsage: Array<{
    period: string;
    transcriptionMinutes: number;
    storageGB: number;
    apiCalls: number;
  }>;
  topWorkspaces: Array<{
    workspaceId: string;
    usage: number;
    workspace: { name: string };
  }>;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface RevenueMetric {
  period: string;
  revenue: number;
  subscriptions: number;
  growth: number;
}

export interface UsageMetric {
  period: string;
  transcriptionMinutes: number;
  storageGB: number;
  apiCalls: number;
}