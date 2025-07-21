/**
 * Subscription Section Component
 * Displays and manages user subscription details
 */

import React, { useState, useEffect } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  RocketIcon
} from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxFilesMonthly: number;
  maxAudioDurationMinutes: number;
  maxConcurrentJobs: number;
  maxWorkspaces: number;
  maxUsers: number;
}

interface SubscriptionSectionProps {
  subscription: any;
  onUpdate: () => void;
}

export default function SubscriptionSection({ subscription, onUpdate }: SubscriptionSectionProps) {
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  const fetchAvailablePlans = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/subscription-plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.plans || mockPlans);
      } else {
        setAvailablePlans(mockPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setAvailablePlans(mockPlans);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/subscription/change', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        setChangingPlan(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error changing plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = subscription?.plan || mockCurrentPlan;
  const isActive = subscription?.status === 'active';

  return (
    <div className="p-6">
      {/* Current Subscription */}
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
                    onClick={() => setChangingPlan(true)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Change Plan
                  </button>
                  <button
                    onClick={handleCancelSubscription}
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

      {/* Change Plan Modal */}
      {changingPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setChangingPlan(false)} />
            
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
                        onClick={() => handleChangePlan(plan.id)}
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
                  onClick={() => setChangingPlan(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mock data for development
const mockCurrentPlan = {
  id: 'pro',
  name: 'Pro Plan',
  price: 49,
  interval: 'monthly' as const,
  features: [
    '500 transcriptions per month',
    'Up to 10 team members',
    '60 minute max audio duration',
    '5 concurrent jobs',
    'Priority support',
    'Advanced analytics'
  ],
  maxTranscriptionsMonthly: 500,
  maxFilesDaily: 50,
  maxFilesMonthly: 500,
  maxAudioDurationMinutes: 60,
  maxConcurrentJobs: 5,
  maxWorkspaces: 3,
  maxUsers: 10
};

const mockPlans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    interval: 'monthly',
    features: [
      '100 transcriptions per month',
      '1 user only',
      '30 minute max audio duration',
      '1 concurrent job',
      'Email support'
    ],
    maxTranscriptionsMonthly: 100,
    maxFilesDaily: 10,
    maxFilesMonthly: 100,
    maxAudioDurationMinutes: 30,
    maxConcurrentJobs: 1,
    maxWorkspaces: 1,
    maxUsers: 1
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    interval: 'monthly',
    features: [
      '500 transcriptions per month',
      'Up to 10 team members',
      '60 minute max audio duration',
      '5 concurrent jobs',
      'Priority support',
      'Advanced analytics'
    ],
    maxTranscriptionsMonthly: 500,
    maxFilesDaily: 50,
    maxFilesMonthly: 500,
    maxAudioDurationMinutes: 60,
    maxConcurrentJobs: 5,
    maxWorkspaces: 3,
    maxUsers: 10
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'monthly',
    features: [
      'Unlimited transcriptions',
      'Unlimited team members',
      'Unlimited audio duration',
      'Unlimited concurrent jobs',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ],
    maxTranscriptionsMonthly: 999999,
    maxFilesDaily: 999999,
    maxFilesMonthly: 999999,
    maxAudioDurationMinutes: 999999,
    maxConcurrentJobs: 999999,
    maxWorkspaces: 999999,
    maxUsers: 999999
  }
];