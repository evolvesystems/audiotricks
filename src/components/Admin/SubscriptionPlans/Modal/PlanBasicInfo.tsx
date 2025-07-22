/**
 * Plan Basic Information Form
 * Handles basic plan details like name, tier, description
 */

import React from 'react';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName?: string;
  tier: string;
  description: string;
  price: number;
  priceAUD: number;
  priceUSD: number;
  priceEUR: number;
  currency: string;
  billingInterval: string;
}

interface PlanBasicInfoProps {
  plan: Partial<SubscriptionPlan>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const PlanBasicInfo: React.FC<PlanBasicInfoProps> = ({ plan, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Plan Name *
          </label>
          <input
            type="text"
            value={plan.name || ''}
            onChange={(e) => onChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g., Pro Plan"
            required
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={plan.displayName || ''}
            onChange={(e) => onChange('displayName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Professional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tier *
          </label>
          <select
            value={plan.tier || ''}
            onChange={(e) => onChange('tier', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.tier ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select tier</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
          {errors.tier && <p className="mt-1 text-sm text-red-600">{errors.tier}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Billing Interval *
          </label>
          <select
            value={plan.billingInterval || ''}
            onChange={(e) => onChange('billingInterval', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.billingInterval ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Select interval</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="one-time">One Time</option>
          </select>
          {errors.billingInterval && <p className="mt-1 text-sm text-red-600">{errors.billingInterval}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={plan.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe what this plan includes..."
        />
      </div>
    </div>
  );
};