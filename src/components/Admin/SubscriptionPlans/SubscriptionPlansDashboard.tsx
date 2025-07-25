/**
 * Modern Admin subscription plans management dashboard
 * Elegant design with modern components and improved UX
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  PlusIcon, 
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import PlanModalEnhanced from './PlanModalEnhanced';
import SubscriptionPlanStats from './SubscriptionPlanStats';
import SubscriptionPlanTable from './SubscriptionPlanTable';
import { apiClient } from '../../../services/api';

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

interface SubscriptionPlansDashboardProps {
  token: string;
}

export default function SubscriptionPlansDashboard({ token }: SubscriptionPlansDashboardProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await apiClient.get('/admin/subscriptions/plans');
      setPlans(data.plans || []);
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;

    try {
      await apiClient.delete(`/admin/subscriptions/plans/${planId}`);
      setPlans(plans.filter(plan => plan.id !== planId));
    } catch (error) {
      alert(error.message || 'Failed to delete plan');
    }
  };

  const handleSavePlan = async (planData: Partial<SubscriptionPlan>) => {
    logger.debug('Attempting to save plan:', planData);
    try {
      let savedPlan;
      
      if (editingPlan) {
        savedPlan = await apiClient.put(`/admin/subscriptions/plans/${editingPlan.id}`, planData);
        // Update existing plan
        setPlans(plans.map(plan => 
          plan.id === editingPlan.id ? { ...plan, ...savedPlan.plan } : plan
        ));
      } else {
        savedPlan = await apiClient.post('/admin/subscriptions/plans', planData);
        // Add new plan
        setPlans([...plans, savedPlan.plan]);
      }

      setShowCreateModal(false);
      setEditingPlan(null);
    } catch (error) {
      logger.error('Error saving plan:', error);
      throw error;
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading subscription plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <CurrencyDollarIcon className="w-6 h-6 text-white" />
            </div>
            Subscription Plans
          </h1>
          <p className="text-gray-600 mt-2">Manage pricing tiers, features, and subscription options</p>
        </div>
        <ActionButton
          variant="primary"
          icon={PlusIcon}
          onClick={() => setShowCreateModal(true)}
        >
          Create Plan
        </ActionButton>
      </div>

      {/* Stats Cards */}
      <SubscriptionPlanStats plans={plans} />

      {/* Plans Table */}
      <SubscriptionPlanTable
        plans={plans}
        loading={loading}
        onEditPlan={setEditingPlan}
        onDeletePlan={handleDeletePlan}
      />

      {/* Plan Modal */}
      <PlanModalEnhanced
        isOpen={showCreateModal || !!editingPlan}
        onClose={() => {
          setShowCreateModal(false);
          setEditingPlan(null);
        }}
        onSave={handleSavePlan}
        plan={editingPlan}
        token={token}
      />
    </div>
  );
}