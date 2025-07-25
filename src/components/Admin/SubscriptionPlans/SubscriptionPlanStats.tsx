/**
 * SubscriptionPlanStats Component
 * Displays subscription plan overview statistics and metrics
 */

import React from 'react';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../Dashboard/StatsCard';

interface SubscriptionPlan {
  id: string;
  name: string;
  tier: string;
  description: string;
  priceAUD: number;
  priceUSD: number;
  priceEUR: number;
  audioProcessingLimit: number;
  storageLimit: number;
  apiCallsLimit: number;
  advancedFeatures: boolean;
  customBranding: boolean;
  prioritySupport: boolean;
  isActive: boolean;
  activeSubscriptions: number;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlanStatsProps {
  plans: SubscriptionPlan[];
}

export default function SubscriptionPlanStats({ plans }: SubscriptionPlanStatsProps) {
  const totalRevenue = plans.reduce((sum, p) => sum + (p.priceAUD * p.activeSubscriptions), 0);
  const totalSubscriptions = plans.reduce((sum, p) => sum + p.activeSubscriptions, 0);
  const activePlans = plans.filter(p => p.isActive).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <StatsCard
        title="Total Plans"
        value={plans.length}
        icon={ChartBarIcon}
        gradient="bg-gradient-to-br from-blue-500 to-blue-600"
        subtitle="All subscription tiers"
      />
      
      <StatsCard
        title="Active Plans"
        value={activePlans}
        icon={SparklesIcon}
        gradient="bg-gradient-to-br from-green-500 to-emerald-600"
        subtitle="Currently available"
      />
      
      <StatsCard
        title="Total Subscribers"
        value={totalSubscriptions}
        icon={UsersIcon}
        gradient="bg-gradient-to-br from-purple-500 to-purple-600"
        subtitle="Across all plans"
      />
      
      <StatsCard
        title="Monthly Revenue"
        value={`$${totalRevenue.toLocaleString()}`}
        icon={CurrencyDollarIcon}
        gradient="bg-gradient-to-br from-yellow-500 to-orange-500"
        subtitle="Potential monthly"
      />
    </div>
  );
}