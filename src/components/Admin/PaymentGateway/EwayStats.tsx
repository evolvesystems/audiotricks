/**
 * EwayStats Component
 * Displays payment gateway overview statistics and metrics
 */

import React from 'react';
import { 
  CreditCardIcon, 
  CheckCircleIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface TransactionOverview {
  transactionStats: {
    _count: { id: number };
    _sum: { amount: number };
  };
  revenueStats: Array<{
    status: string;
    _sum: { amount: number };
    _count: { id: number };
  }>;
  statusDistribution: Array<{
    status: string;
    _count: { status: number };
  }>;
}

interface SystemHealth {
  recentTransactions: number;
  failedTransactions: number;
  webhookBacklog: number;
  recurringScheduleStats: Array<{
    status: string;
    _count: { status: number };
  }>;
  lastUpdated: string;
}

interface EwayStatsProps {
  overview: TransactionOverview | null;
  health: SystemHealth | null;
}

export default function EwayStats({ overview, health }: EwayStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount / 100); // Assuming amounts are in cents
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'declined': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* System Health Alert */}
      {health && health.webhookBacklog > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Webhook Processing Backlog
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                {health.webhookBacklog} webhook events are pending processing. 
                Check the webhook management section for details.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CreditCardIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview?.transactionStats._count.id || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {overview?.transactionStats._sum.amount ? formatCurrency(overview.transactionStats._sum.amount) : '$0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Recent Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {health ? `${((health.recentTransactions / (health.recentTransactions + health.failedTransactions)) * 100).toFixed(1)}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending Webhooks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {health?.webhookBacklog || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Status Distribution</h3>
          <div className="space-y-3">
            {overview?.statusDistribution.map((status) => (
              <div key={status.status} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status.status)}`}>
                    {status.status}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {status._count.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue by Status</h3>
          <div className="space-y-3">
            {overview?.revenueStats.map((revenue) => (
              <div key={revenue.status} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(revenue.status)}`}>
                    {revenue.status}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(revenue._sum.amount || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}