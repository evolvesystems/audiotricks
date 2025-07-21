import React from 'react';
import { UsageData, SubscriptionService } from '../../services/subscription';
import { UsageProgress } from './UsageProgress';

interface UsageDisplayProps {
  usage: UsageData;
  currency: string;
}

/**
 * Usage statistics display component
 */
export const UsageDisplay: React.FC<UsageDisplayProps> = ({ usage, currency }) => {
  const subscriptionService = new SubscriptionService();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Usage This Period</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <UsageProgress
            label="Storage Used"
            used={usage.usage.storage_used?.quantity || 0}
            limit={usage.quotas.storage_gb}
            unit=" GB"
          />
          <UsageProgress
            label="Processing Minutes"
            used={usage.usage.processing_minutes?.quantity || 0}
            limit={usage.quotas.processing_minutes}
            unit=" min"
          />
          <UsageProgress
            label="Transcription Minutes"
            used={usage.usage.transcription_minutes?.quantity || 0}
            limit={usage.quotas.transcription_minutes}
            unit=" min"
          />
        </div>
        
        <div>
          <UsageProgress
            label="API Calls"
            used={usage.usage.api_calls?.quantity || 0}
            limit={usage.quotas.api_calls_per_month}
          />
          <UsageProgress
            label="AI Tokens"
            used={usage.usage.ai_tokens?.quantity || 0}
            limit={usage.quotas.ai_tokens_per_month}
          />
          
          {usage.totalCost > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Usage Charges:</span>
                <span className="text-lg font-bold text-gray-900">
                  {subscriptionService.formatCurrency(usage.totalCost, currency)}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Additional charges for overage usage
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};