import React, { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionPlan, Currency } from '../../services/subscription';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';

interface SubscriptionPlansProps {
  workspaceId: string;
  currentPlanId?: string;
  onPlanSelect: (planId: string, pricing: any) => void;
  selectedCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

/**
 * SubscriptionPlans component displays available subscription plans
 * with pricing in different currencies
 */
export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({
  workspaceId,
  currentPlanId,
  onPlanSelect,
  selectedCurrency = 'USD',
  onCurrencyChange
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    loadData();
  }, [selectedCurrency]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansData, currenciesData] = await Promise.all([
        subscriptionService.getPlans(selectedCurrency),
        subscriptionService.getCurrencies()
      ]);

      setPlans(plansData);
      setCurrencies(currenciesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPlans = () => {
    return plans.filter(plan => {
      // Filter by billing period
      if (billingPeriod === 'yearly') {
        return plan.name.includes('yearly') || plan.pricing.some(p => p.billingPeriod === 'yearly');
      } else {
        return !plan.name.includes('yearly') && plan.pricing.some(p => p.billingPeriod === 'monthly');
      }
    });
  };

  const getPlanPricing = (plan: SubscriptionPlan) => {
    return plan.pricing.find(p => 
      p.currency === selectedCurrency && 
      p.billingPeriod === billingPeriod
    ) || plan.pricing.find(p => p.billingPeriod === billingPeriod);
  };

  const calculateYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyPricing = plan.pricing.find(p => 
      p.currency === selectedCurrency && p.billingPeriod === 'monthly'
    );
    const yearlyPricing = plan.pricing.find(p => 
      p.currency === selectedCurrency && p.billingPeriod === 'yearly'
    );

    if (monthlyPricing && yearlyPricing) {
      const monthlyTotal = monthlyPricing.price * 12;
      const savings = monthlyTotal - yearlyPricing.price;
      const percentage = Math.round((savings / monthlyTotal) * 100);
      return { amount: savings, percentage };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={loadData} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  const filteredPlans = getFilteredPlans();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Plan
        </h2>
        <p className="text-lg text-gray-600">
          Select the perfect plan for your audio processing needs
        </p>
      </div>

      {/* Controls */}
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

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => {
          const pricing = getPlanPricing(plan);
          const isCurrentPlan = plan.id === currentPlanId;
          const features = subscriptionService.getPlanFeatures(plan);
          const quotas = subscriptionService.getPlanQuotas(plan);
          const savings = billingPeriod === 'yearly' ? calculateYearlySavings(plan) : null;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.tier === 'pro'
                  ? 'border-blue-500 shadow-lg scale-105'
                  : isCurrentPlan
                  ? 'border-green-500'
                  : 'border-gray-200'
              } ${
                plan.tier === 'pro' ? 'bg-gradient-to-b from-blue-50 to-white' : 'bg-white'
              }`}
            >
              {/* Popular Badge */}
              {plan.tier === 'pro' && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute top-4 right-4">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-gray-600 mb-4">
                  {plan.description}
                </p>

                {/* Pricing */}
                <div className="mb-4">
                  {pricing ? (
                    <>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-bold text-gray-900">
                          {subscriptionService.formatCurrency(pricing.price, pricing.currency)}
                        </span>
                        <span className="text-gray-600 ml-2">
                          /{billingPeriod === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                      
                      {savings && (
                        <div className="mt-2 text-sm text-green-600 font-medium">
                          Save {subscriptionService.formatCurrency(savings.amount, selectedCurrency)} 
                          ({savings.percentage}%) yearly
                        </div>
                      )}

                      {billingPeriod === 'yearly' && pricing.price > 0 && (
                        <div className="mt-1 text-sm text-gray-500">
                          {subscriptionService.formatCurrency(pricing.price / 12, pricing.currency)}/month
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-gray-900">
                      Custom
                    </div>
                  )}
                </div>

                {/* Trial */}
                {plan.trialDays > 0 && (
                  <div className="text-sm text-blue-600 font-medium">
                    {plan.trialDays}-day free trial
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Features:</h4>
                <ul className="space-y-2">
                  {features.slice(0, 6).map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                  {features.length > 6 && (
                    <li className="text-sm text-gray-500 ml-6">
                      +{features.length - 6} more features
                    </li>
                  )}
                </ul>
              </div>

              {/* Key Quotas */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-3">Includes:</h4>
                <div className="space-y-2">
                  {Object.entries(quotas).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={() => pricing && onPlanSelect(plan.id, pricing)}
                disabled={isCurrentPlan || !pricing}
                variant={plan.tier === 'pro' ? 'primary' : 'outline'}
                className="w-full"
                size="lg"
              >
                {isCurrentPlan 
                  ? 'Current Plan' 
                  : plan.tier === 'free' 
                  ? 'Get Started Free'
                  : `Choose ${plan.displayName}`
                }
              </Button>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Note */}
      <div className="mt-12 text-center">
        <p className="text-gray-600">
          Need help choosing? 
          <button className="ml-1 text-blue-600 hover:text-blue-700 font-medium">
            Compare all features
          </button>
        </p>
      </div>
    </div>
  );
};