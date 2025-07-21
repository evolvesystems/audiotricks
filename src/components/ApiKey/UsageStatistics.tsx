import React from 'react';
import ApiKeyService, { ApiKeyUsageStats } from '../../services/apikey.service';

interface UsageStatisticsProps {
  usage: ApiKeyUsageStats;
}

export default function UsageStatistics({ usage }: UsageStatisticsProps) {
  const formatted = ApiKeyService.formatUsageStats(usage);
  
  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-900 mb-3">
        Usage Statistics (Last 30 Days)
      </h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-blue-700">Total Calls:</span>
          <span className="ml-2 font-medium">{formatted.formattedCalls}</span>
        </div>
        <div>
          <span className="text-blue-700">Total Cost:</span>
          <span className="ml-2 font-medium">{formatted.formattedCost}</span>
        </div>
        <div>
          <span className="text-blue-700">Success Rate:</span>
          <span className="ml-2 font-medium">{formatted.successRatePercentage}</span>
        </div>
        <div>
          <span className="text-blue-700">Tokens Used:</span>
          <span className="ml-2 font-medium">{formatted.formattedTokens}</span>
        </div>
      </div>
    </div>
  );
}