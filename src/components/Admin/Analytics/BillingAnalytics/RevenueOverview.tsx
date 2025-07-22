/**
 * Revenue overview component for billing analytics
 */

import React from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { BillingAnalytics } from './types';

interface RevenueOverviewProps {
  analytics: BillingAnalytics;
  isLoading: boolean;
}

export const RevenueOverview: React.FC<RevenueOverviewProps> = ({ analytics, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const monthlyGrowth = analytics.monthlyRevenue > 0 
    ? ((analytics.monthlyRevenue / (analytics.totalRevenue - analytics.monthlyRevenue)) * 100) || 0
    : 0;

  const activeSubscriptions = analytics.subscriptionStats
    .find(stat => stat.status === 'active')?._count.status || 0;

  const totalSubscriptions = analytics.subscriptionStats
    .reduce((sum, stat) => sum + stat._count.status, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Total Revenue */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">
              ${analytics.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-full">
            <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
          <span className="text-green-600 font-medium">
            {monthlyGrowth.toFixed(1)}%
          </span>
          <span className="text-gray-500 ml-1">vs last period</span>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">This Month</p>
            <p className="text-3xl font-bold text-gray-900">
              ${analytics.monthlyRevenue.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-full">
            <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>Monthly recurring revenue</span>
          </div>
        </div>
      </div>

      {/* Active Subscriptions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
            <p className="text-3xl font-bold text-gray-900">
              {activeSubscriptions.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-purple-100 rounded-full">
            <ArrowTrendingUpIcon className="h-6 w-6 text-purple-600" />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center text-sm text-gray-600">
            <span>
              {totalSubscriptions > 0 
                ? `${((activeSubscriptions / totalSubscriptions) * 100).toFixed(1)}% of total`
                : 'No subscriptions'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};