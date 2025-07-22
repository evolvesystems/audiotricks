/**
 * Plan Pricing Form
 * Handles pricing for different currencies
 */

import React from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  price: number;
  priceAUD: number;
  priceUSD: number;
  priceEUR: number;
  currency: string;
}

interface PlanPricingProps {
  plan: Partial<SubscriptionPlan>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const PlanPricing: React.FC<PlanPricingProps> = ({ plan, onChange, errors }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
        <h3 className="text-lg font-medium text-gray-900">Pricing</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Currency
          </label>
          <select
            value={plan.currency || 'AUD'}
            onChange={(e) => onChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="AUD">Australian Dollar (AUD)</option>
            <option value="USD">US Dollar (USD)</option>
            <option value="EUR">Euro (EUR)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Price ({plan.currency || 'AUD'}) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">
                {plan.currency === 'USD' ? '$' : plan.currency === 'EUR' ? '€' : '$'}
              </span>
            </div>
            <input
              type="number"
              value={plan.price || ''}
              onChange={(e) => onChange('price', parseFloat(e.target.value) || 0)}
              className={`w-full pl-8 pr-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                errors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
              step="0.01"
              required
            />
          </div>
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Multi-Currency Pricing</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              AUD Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                value={plan.priceAUD || ''}
                onChange={(e) => onChange('priceAUD', parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              USD Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                type="number"
                value={plan.priceUSD || ''}
                onChange={(e) => onChange('priceUSD', parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              EUR Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">€</span>
              </div>
              <input
                type="number"
                value={plan.priceEUR || ''}
                onChange={(e) => onChange('priceEUR', parseFloat(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="0.00"
                step="0.01"
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Set pricing for different currencies. Leave blank to use automatic conversion.
        </p>
      </div>
    </div>
  );
};