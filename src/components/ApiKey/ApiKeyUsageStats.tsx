/**
 * API Key Usage Statistics - Display component for API key usage metrics
 */

import React from 'react';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ApiKeyUsageStats as UsageStats } from '../../services/apikey.service';

interface ApiKeyUsageStatsProps {
  usage: UsageStats | null;
  onRefresh: () => void;
}

export const ApiKeyUsageStats: React.FC<ApiKeyUsageStatsProps> = ({
  usage,
  onRefresh
}) => {
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Usage Statistics</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={!usage}
        >
          Refresh
        </Button>
      </div>
      {usage ? (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Requests:</span>
            <div className="font-semibold">{usage.totalRequests.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Total Tokens:</span>
            <div className="font-semibold">{usage.totalTokens?.toLocaleString() || 'N/A'}</div>
          </div>
          <div>
            <span className="text-gray-600">This Month:</span>
            <div className="font-semibold">{usage.currentMonthRequests.toLocaleString()}</div>
          </div>
          <div>
            <span className="text-gray-600">Last Used:</span>
            <div className="font-semibold">
              {usage.lastUsed ? new Date(usage.lastUsed).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      )}
    </div>
  );
};