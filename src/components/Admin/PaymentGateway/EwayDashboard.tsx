/**
 * Admin eWAY payment gateway dashboard
 * Provides overview of transactions, customers, and system health
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  CreditCardIcon, 
  UserGroupIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import EwayConfiguration from './EwayConfiguration';

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
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
    ewayCustomer: {
      customerReference: string;
      firstName: string;
      lastName: string;
      email: string;
    };
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

interface EwayDashboardProps {
  token: string;
}

export default function EwayDashboard({ token }: EwayDashboardProps) {
  const [overview, setOverview] = useState<TransactionOverview | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');
  const [activeTab, setActiveTab] = useState<'overview' | 'configuration'>('overview');

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchData();
    }
  }, [timeframe, activeTab]);

  const fetchData = async () => {
    try {
      const [overviewResponse, healthResponse] = await Promise.all([
        fetch(`/api/admin/eway/overview?timeframe=${timeframe}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/eway/health', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (overviewResponse.ok && healthResponse.ok) {
        const overviewData = await overviewResponse.json();
        const healthData = await healthResponse.json();
        setOverview(overviewData.overview);
        setHealth(healthData.health);
      }
    } catch (error) {
      logger.error('Error fetching eWAY dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount / 100); // Assuming amounts are in cents
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCardIcon className="w-8 h-8 text-blue-600" />
              eWAY Payment Gateway
            </h1>
            <p className="text-gray-600 mt-2">Monitor transactions, customers, and system health</p>
          </div>
          {activeTab === 'overview' && (
            <div className="flex items-center gap-4">
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('configuration')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === 'configuration'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CogIcon className="w-4 h-4" />
            Configuration
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' ? (
        <>
          {/* System Health Alert */}
          {health && health.webhookBacklog > 0 && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      {/* Recent Transactions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
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
              {overview?.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.ewayCustomer.firstName} {transaction.ewayCustomer.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{transaction.ewayCustomer.email}</div>
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

        {overview?.recentTransactions.length === 0 && (
          <div className="text-center py-12">
            <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">No transactions in the selected timeframe.</p>
          </div>
        )}
      </div>
        </>
      ) : (
        <EwayConfiguration token={token} onConfigSaved={fetchData} />
      )}
    </div>
  );
}