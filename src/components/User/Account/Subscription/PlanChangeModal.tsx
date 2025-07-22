/**
 * Plan Change Modal Component
 * Modal for selecting and changing subscription plans
 */

import React from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  maxTranscriptionsMonthly: number;
  maxUsers: number;
  maxAudioDurationMinutes: number;
}

interface PlanChangeModalProps {
  isOpen: boolean;
  availablePlans: SubscriptionPlan[];
  currentPlan: SubscriptionPlan;
  loading: boolean;
  onClose: () => void;
  onChangePlan: (planId: string) => void;
}

export const PlanChangeModal: React.FC<PlanChangeModalProps> = ({
  isOpen,
  availablePlans,
  currentPlan,
  loading,
  onClose,
  onChangePlan
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Choose a New Plan</h3>
            <p className="text-gray-600 mt-1">Select the plan that best fits your needs</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {availablePlans.map((plan) => (
              <div 
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  plan.id === currentPlan.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    ${plan.price}
                    <span className="text-sm font-normal text-gray-500">/{plan.interval}</span>
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  <li className="text-sm text-gray-600">
                    <strong>{plan.maxTranscriptionsMonthly}</strong> jobs/month
                  </li>
                  <li className="text-sm text-gray-600">
                    <strong>{plan.maxUsers}</strong> team members
                  </li>
                  <li className="text-sm text-gray-600">
                    <strong>{plan.maxAudioDurationMinutes}</strong> min max duration
                  </li>
                </ul>

                {plan.id === currentPlan.id ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 text-sm font-medium text-gray-500 bg-gray-100 rounded-lg cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => onChangePlan(plan.id)}
                    disabled={loading}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Select Plan
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};