/**
 * Billing History Section Component
 * Displays user's billing and payment history
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  invoiceUrl?: string;
}

export default function BillingHistorySection() {
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/billing-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data.records || []);
      } else {
        setBillingHistory([]);
      }
    } catch (error) {
      logger.error('Error fetching billing history:', error);
      setBillingHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (invoiceUrl: string) => {
    // In a real app, this would download the invoice PDF
    window.open(invoiceUrl, '_blank');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredHistory = filter === 'all' 
    ? billingHistory 
    : billingHistory.filter(record => record.status === filter);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {(['all', 'paid', 'pending', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Billing History Table */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No billing records</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You don't have any billing history yet."
              : `No ${filter} payments found.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHistory.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${record.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(record.status)}`}>
                      {getStatusIcon(record.status)}
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {record.invoiceUrl && record.status === 'paid' && (
                      <button
                        onClick={() => handleDownloadInvoice(record.invoiceUrl!)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        Invoice
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Paid</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${billingHistory
              .filter(r => r.status === 'paid')
              .reduce((sum, r) => sum + r.amount, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${billingHistory
              .filter(r => r.status === 'pending')
              .reduce((sum, r) => sum + r.amount, 0)
              .toFixed(2)}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">Next Payment</p>
          <p className="text-2xl font-semibold text-gray-900">
            ${49.00}
          </p>
          <p className="text-xs text-gray-600 mt-1">Due Feb 1, 2024</p>
        </div>
      </div>
    </div>
  );
}