/**
 * Admin billing and usage analytics dashboard
 * Provides comprehensive analytics for subscriptions, revenue, and usage patterns
 */

import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon, 
  UsersIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface BillingAnalytics {
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

interface UsageAnalytics {
  totalUsage: Array<{
    metricType: string;
    _sum: { value: number };
    _count: { id: number };
  }>;
  topWorkspaces: Array<{
    audioProcessingCount: number;
    workspace: { id: string; name: string };
  }>;
  usageTrends: Array<{
    id: string;
    metricType: string;
    value: number;
    timestamp: string;
  }>;
}

interface BillingAnalyticsDashboardProps {
  token: string;
}

export default function BillingAnalyticsDashboard({ token }: BillingAnalyticsDashboardProps) {
  const [billingAnalytics, setBillingAnalytics] = useState<BillingAnalytics | null>(null);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'billing' | 'usage'>('billing');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [billingResponse, usageResponse] = await Promise.all([
        fetch('/api/admin/analytics/billing', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/analytics/usage', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (billingResponse.ok && usageResponse.ok) {
        const billingData = await billingResponse.json();
        const usageData = await usageResponse.json();
        setBillingAnalytics(billingData.analytics);
        setUsageAnalytics(usageData.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-8 h-8 text-purple-600" />
          Billing & Usage Analytics
        </h1>
        <p className="text-gray-600 mt-2">Monitor revenue, subscriptions, and usage patterns</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'billing'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            💰 Billing Analytics
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Usage Analytics
          </button>
        </nav>
      </div>

      {activeTab === 'billing' && billingAnalytics && (
        <div className="space-y-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(billingAnalytics.totalRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(billingAnalytics.monthlyRevenue)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UsersIcon className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {billingAnalytics.subscriptionStats.find(s => s.status === 'active')?._count.status || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Recent Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {billingAnalytics.recentTransactions.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Status</h3>
              <div className="space-y-3">
                {billingAnalytics.subscriptionStats.map((stat) => (
                  <div key={stat.status} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(stat.status)}`}>
                        {stat.status}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {stat._count.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {billingAnalytics.planDistribution.map((plan) => (
                  <div key={plan.subscriptionPlanId} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-900">
                        {plan.subscriptionPlan?.name || 'Unknown Plan'}
                      </span>
                      <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {plan.subscriptionPlan?.tier || 'N/A'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {plan._count.subscriptionPlanId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Billing Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billingAnalytics.recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.workspace.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(transaction.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'usage' && usageAnalytics && (
        <div className="space-y-6">
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {usageAnalytics.totalUsage.map((usage) => (
              <div key={usage.metricType} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-500">{usage.metricType}</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {usage._sum.value?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Top Workspaces */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Top Workspaces by Usage</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workspace
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio Processing Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usageAnalytics.topWorkspaces.map((workspace) => (
                    <tr key={workspace.workspace.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {workspace.workspace.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {workspace.audioProcessingCount.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}