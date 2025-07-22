/**
 * Subscription Section Component - Refactored
 * Displays and manages user subscription details using modular components
 */

import React, { useState, useEffect } from 'react';
import { CurrentSubscription } from './Subscription/CurrentSubscription';
import { PlanChangeModal } from './Subscription/PlanChangeModal';
import { mockCurrentPlan, mockPlans, SubscriptionPlan } from './Subscription/mockData';
import { logger } from '../../../utils/logger';

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
      logger.error('Error fetching plans:', error);
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
      logger.error('Error canceling subscription:', error);
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
      logger.error('Error changing plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = subscription?.plan || mockCurrentPlan;
  const isActive = subscription?.status === 'active';

  return (
    <div className="p-6">
      <CurrentSubscription
        subscription={subscription}
        currentPlan={currentPlan}
        isActive={isActive}
        onChangePlan={() => setChangingPlan(true)}
        onCancelSubscription={handleCancelSubscription}
        loading={loading}
      />

      <PlanChangeModal
        isOpen={changingPlan}
        availablePlans={availablePlans}
        currentPlan={currentPlan}
        loading={loading}
        onClose={() => setChangingPlan(false)}
        onChangePlan={handleChangePlan}
      />
    </div>
  );
}