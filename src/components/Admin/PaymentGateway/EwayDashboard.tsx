/**
 * Admin eWAY payment gateway dashboard
 * Provides overview of transactions, customers, and system health
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  CreditCardIcon, 
  CogIcon
} from '@heroicons/react/24/outline';
import EwayConfiguration from './EwayConfiguration';
import EwayStats from './EwayStats';
import TransactionsList from './TransactionsList';
import { apiClient } from '../../../services/api';

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
      const [overviewData, healthData] = await Promise.all([
        apiClient.get('/admin/eway/overview', { timeframe }),
        apiClient.get('/admin/eway/health')
      ]);

      setOverview(overviewData.overview);
      setHealth(healthData.health);
    } catch (error) {
      logger.error('Error fetching eWAY dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="space-y-8">
          <EwayStats overview={overview} health={health} />
          <TransactionsList transactions={overview?.recentTransactions || []} />
        </div>
      ) : (
        <EwayConfiguration token={token} onConfigSaved={fetchData} />
      )}
    </div>
  );
}