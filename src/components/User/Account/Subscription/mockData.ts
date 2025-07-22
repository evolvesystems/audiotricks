/**
 * Mock Data for Subscription Components
 * Centralized mock data for development
 */

export interface SubscriptionPlan {
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

export const mockCurrentPlan: SubscriptionPlan = {
  id: 'pro',
  name: 'Pro Plan',
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
};

export const mockPlans: SubscriptionPlan[] = [
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