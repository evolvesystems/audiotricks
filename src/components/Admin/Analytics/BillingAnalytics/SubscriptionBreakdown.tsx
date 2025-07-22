/**
 * Subscription breakdown component for billing analytics
 */

import React from 'react';
import { UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { BillingAnalytics } from './types';

interface SubscriptionBreakdownProps {
  analytics: BillingAnalytics;
  isLoading: boolean;
}

export const SubscriptionBreakdown: React.FC<SubscriptionBreakdownProps> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Process subscription status data
  const statusData = analytics.subscriptionStats.map(stat => ({
    status: stat.status,
    count: stat._count.status,
    percentage: (stat._count.status / analytics.subscriptionStats.reduce((sum, s) => sum + s._count.status, 0) * 100) || 0
  }));

  // Process plan distribution data
  const planData = analytics.planDistribution.map(plan => ({
    planId: plan.subscriptionPlanId,
    planName: plan.subscriptionPlan?.name || 'Unknown Plan',
    tier: plan.subscriptionPlan?.tier || 'unknown',
    count: plan._count.subscriptionPlanId,
    percentage: (plan._count.subscriptionPlanId / analytics.planDistribution.reduce((sum, p) => sum + p._count.subscriptionPlanId, 0) * 100) || 0
  }));

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'trialing': return 'bg-blue-100 text-blue-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Subscription Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Subscription Status</h3>
          <div className="p-2 bg-blue-100 rounded-lg">
            <UsersIcon className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          {statusData.length > 0 ? statusData.map((status) => (
            <div key={status.status} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(status.status)}`}>
                  {status.status}
                </span>
                <span className="text-sm text-gray-600">{status.count} subscriptions</span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {status.percentage.toFixed(1)}%
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              No subscription data available
            </div>
          )}
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Plan Distribution</h3>
          <div className="p-2 bg-purple-100 rounded-lg">
            <ChartBarIcon className="h-5 w-5 text-purple-600" />
          </div>
        </div>
        
        <div className="space-y-3">
          {planData.length > 0 ? planData.map((plan) => (
            <div key={plan.planId} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getTierBadgeColor(plan.tier)}`}>
                  {plan.tier}
                </span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{plan.planName}</div>
                  <div className="text-xs text-gray-500">{plan.count} subscriptions</div>
                </div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {plan.percentage.toFixed(1)}%
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              No plan data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};