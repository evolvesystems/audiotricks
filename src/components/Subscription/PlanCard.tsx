/**
 * Plan Card - Individual subscription plan display card
 */

import React from 'react';
import { SubscriptionPlan, SubscriptionService } from '../../services/subscription';
import { Button } from '../ui/Button';

interface PlanCardProps {
  plan: SubscriptionPlan;
  currentPlanId?: string;
  selectedCurrency: string;
  billingPeriod: 'monthly' | 'yearly';
  onPlanSelect: (planId: string, pricing: any) => void;
  subscriptionService: SubscriptionService;
}

export default function PlanCard({
  plan,
  currentPlanId,
  selectedCurrency,
  billingPeriod,
  onPlanSelect,
  subscriptionService
}: PlanCardProps) {
  const pricing = plan.pricing.find(p => 
    p.currency === selectedCurrency && 
    p.billingPeriod === billingPeriod
  ) || plan.pricing.find(p => p.billingPeriod === billingPeriod);

  const isCurrentPlan = plan.id === currentPlanId;
  const features = subscriptionService.getPlanFeatures(plan);
  const quotas = subscriptionService.getPlanQuotas(plan);

  const calculateYearlySavings = () => {
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

  const savings = billingPeriod === 'yearly' ? calculateYearlySavings() : null;

  return (
    <div
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
}