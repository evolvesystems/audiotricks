import React from 'react';
import { SubscriptionService } from '../../services/subscription';

interface UsageProgressProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

/**
 * Usage progress bar component with color-coded status
 */
export const UsageProgress: React.FC<UsageProgressProps> = ({ 
  label, 
  used, 
  limit, 
  unit = '' 
}) => {
  const subscriptionService = new SubscriptionService();
  const percentage = subscriptionService.getUsagePercentage(used, limit);
  const color = subscriptionService.getUsageStatusColor(percentage);

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className={`text-xs font-medium ${
          percentage >= 90 ? 'text-red-600' : 
          percentage >= 75 ? 'text-orange-600' : 
          'text-gray-500'
        }`}>
          {percentage}% used
        </span>
        {percentage >= 90 && (
          <span className="text-xs text-red-600">
            Approaching limit
          </span>
        )}
      </div>
    </div>
  );
};