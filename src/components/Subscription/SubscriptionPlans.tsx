import React, { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionPlan, Currency } from '../../services/subscription';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import PlanCard from './PlanCard';
import PlanControls from './PlanControls';

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

      <PlanControls
        currencies={currencies}
        selectedCurrency={selectedCurrency}
        onCurrencyChange={onCurrencyChange}
        billingPeriod={billingPeriod}
        setBillingPeriod={setBillingPeriod}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currentPlanId={currentPlanId}
            selectedCurrency={selectedCurrency}
            billingPeriod={billingPeriod}
            onPlanSelect={onPlanSelect}
            subscriptionService={subscriptionService}
          />
        ))}
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