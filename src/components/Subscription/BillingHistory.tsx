import React from 'react';
import { BillingRecord, SubscriptionService } from '../../services/subscription';
import { Button } from '../ui/Button';

interface BillingHistoryProps {
  billingHistory: BillingRecord[];
  workspaceId: string;
  currency: string;
}

/**
 * Billing history table component
 */
export const BillingHistory: React.FC<BillingHistoryProps> = ({
  billingHistory,
  workspaceId,
  currency
}) => {
  const subscriptionService = new SubscriptionService();

  if (billingHistory.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Recent Billing</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = `/workspaces/${workspaceId}/billing/history`}
        >
          View All
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
              <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
              <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
              <th className="text-left py-3 text-sm font-medium text-gray-600">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {billingHistory.map((record) => (
              <tr key={record.id} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-900">
                  {new Date(record.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 text-sm text-gray-900">
                  {subscriptionService.formatCurrency(record.amount, record.currency)}
                </td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    record.status === 'paid' ? 'bg-green-100 text-green-800' :
                    record.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </span>
                </td>
                <td className="py-3">
                  {record.invoiceUrl ? (
                    <a
                      href={record.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};