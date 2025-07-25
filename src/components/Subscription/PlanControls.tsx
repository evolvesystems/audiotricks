/**
 * Plan Controls - Currency selector and billing period toggle
 */

import React from 'react';
import { Currency } from '../../services/subscription';

interface PlanControlsProps {
  currencies: Currency[];
  selectedCurrency: string;
  onCurrencyChange?: (currency: string) => void;
  billingPeriod: 'monthly' | 'yearly';
  setBillingPeriod: (period: 'monthly' | 'yearly') => void;
}

export default function PlanControls({
  currencies,
  selectedCurrency,
  onCurrencyChange,
  billingPeriod,
  setBillingPeriod
}: PlanControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
      {/* Currency Selector */}
      {onCurrencyChange && (
        <div className="flex items-center gap-2">
          <label htmlFor="currency" className="text-sm font-medium text-gray-700">
            Currency:
          </label>
          <select
            id="currency"
            value={selectedCurrency}
            onChange={(e) => onCurrencyChange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {currencies.map(currency => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.code} - {currency.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setBillingPeriod('monthly')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            billingPeriod === 'monthly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingPeriod('yearly')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            billingPeriod === 'yearly'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Yearly
          <span className="ml-1 text-xs text-green-600 font-semibold">
            Save up to 17%
          </span>
        </button>
      </div>
    </div>
  );
}