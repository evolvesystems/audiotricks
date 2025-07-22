/**
 * Current Subscription Component
 * Displays subscription details, usage, and features
 */

import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxWorkspaces: number;
  maxUsers: number;
}

interface CurrentSubscriptionProps {
  subscription: any;
  currentPlan: SubscriptionPlan;
  isActive: boolean;
  onChangePlan: () => void;
  onCancelSubscription: () => void;
  loading: boolean;
}

export const CurrentSubscription: React.FC<CurrentSubscriptionProps> = ({
  subscription,
  currentPlan,
  isActive,
  onChangePlan,
  onCancelSubscription,
  loading
}) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Subscription</h3>
      
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-xl font-semibold text-gray-900">{currentPlan.name}</h4>
              {isActive ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                  <CheckIcon className="h-3 w-3" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
                  <XMarkIcon className="h-3 w-3" />
                  Inactive
                </span>
              )}
            </div>
            
            <p className="text-2xl font-bold text-gray-900">
              ${currentPlan.price}
              <span className="text-sm font-normal text-gray-500">/{currentPlan.interval}</span>
            </p>
            
            {subscription?.nextBillingDate && (
              <p className="text-sm text-gray-600 mt-2">
                Next billing date: {new Date(subscription.nextBillingDate).toLocaleDateString()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {isActive && (
              <>
                <button
                  onClick={onChangePlan}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Change Plan
                </button>
                <button
                  onClick={onCancelSubscription}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  Cancel Subscription
                </button>
              </>
            )}
          </div>
        </div>

        {/* Usage Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-4">Current Usage</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Jobs This Month</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.usage?.transcriptionsThisMonth || 0} / {currentPlan.maxTranscriptionsMonthly}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Files Today</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.usage?.filesToday || 0} / {currentPlan.maxFilesDaily}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Team Members</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.usage?.teamMembers || 1} / {currentPlan.maxUsers}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Workspaces</p>
              <p className="text-lg font-semibold text-gray-900">
                {subscription?.usage?.workspaces || 1} / {currentPlan.maxWorkspaces}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-3">Included Features</h5>
          <ul className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-600">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};