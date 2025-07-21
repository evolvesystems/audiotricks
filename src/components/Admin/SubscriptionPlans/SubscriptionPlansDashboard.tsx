/**
 * Modern Admin subscription plans management dashboard
 * Elegant design with modern components and improved UX
 */

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import StatsCard from '../Dashboard/StatsCard';
import ModernTable from '../Dashboard/ModernTable';
import ActionButton from '../Dashboard/ActionButton';
import PlanModalEnhanced from './PlanModalEnhanced';

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
      const response = await fetch('/api/admin/subscriptions/plans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans || []);
      } else {
        console.error('Failed to fetch subscription plans');
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this subscription plan?')) return;

    try {
      const response = await fetch(`/api/admin/subscriptions/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setPlans(plans.filter(plan => plan.id !== planId));
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete plan');
      }
    } catch (error) {
      alert('Failed to delete plan');
    }
  };

  const handleSavePlan = async (planData: Partial<SubscriptionPlan>) => {
    console.log('Attempting to save plan:', planData);
    try {
      const url = editingPlan 
        ? `/api/admin/subscriptions/plans/${editingPlan.id}`
        : '/api/admin/subscriptions/plans';
      
      const method = editingPlan ? 'PUT' : 'POST';
      console.log('Request URL:', url);
      console.log('Request method:', method);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(planData)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const savedPlan = await response.json();
        
        if (editingPlan) {
          // Update existing plan
          setPlans(plans.map(plan => 
            plan.id === editingPlan.id ? { ...plan, ...savedPlan.plan } : plan
          ));
        } else {
          // Add new plan
          setPlans([...plans, savedPlan.plan]);
        }

        setShowCreateModal(false);
        setEditingPlan(null);
      } else {
        const error = await response.json();
        console.log('Error response:', error);
        throw new Error(error.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Cannot connect to server. Is the backend running?');
      }
      throw error;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-green-100 text-green-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalRevenue = plans.reduce((sum, p) => sum + (p.priceAUD * p.activeSubscriptions), 0);
  const totalSubscriptions = plans.reduce((sum, p) => sum + p.activeSubscriptions, 0);

  const tableColumns = [
    {
      key: 'name',
      header: 'Plan Details',
      render: (value: string, row: SubscriptionPlan) => (
        <div>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${row.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <div>
              <div className="font-semibold text-gray-900">{row.name}</div>
              <div className="text-sm text-gray-500">{row.description}</div>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'tier',
      header: 'Tier',
      render: (value: string) => (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTierColor(value)}`}>
          {value}
        </span>
      )
    },
    {
      key: 'pricing',
      header: 'Pricing',
      render: (value: any, row: SubscriptionPlan) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">${row.priceAUD} AUD</div>
          <div className="text-sm text-gray-500">${row.priceUSD} USD</div>
        </div>
      )
    },
    {
      key: 'limits',
      header: 'Usage Limits',
      render: (value: any, row: SubscriptionPlan) => (
        <div className="space-y-1 text-sm">
          <div>{row.audioProcessingLimit.toLocaleString()} audio files</div>
          <div className="text-gray-500">{row.storageLimit}GB storage</div>
        </div>
      )
    },
    {
      key: 'features',
      header: 'Features',
      render: (value: any, row: SubscriptionPlan) => (
        <div className="flex flex-wrap gap-1">
          {row.advancedFeatures && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-700">
              Advanced
            </span>
          )}
          {row.customBranding && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-700">
              Branding
            </span>
          )}
          {row.prioritySupport && (
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-700">
              Priority
            </span>
          )}
        </div>
      )
    },
    {
      key: 'activeSubscriptions',
      header: 'Subscribers',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-gray-400" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (value: any, row: SubscriptionPlan) => (
        <div className="flex items-center gap-2">
          <ActionButton
            variant="secondary"
            size="sm"
            icon={PencilIcon}
            onClick={() => setEditingPlan(row)}
          >
            Edit
          </ActionButton>
          <ActionButton
            variant="danger"
            size="sm"
            icon={TrashIcon}
            onClick={() => handleDeletePlan(row.id)}
            disabled={row.activeSubscriptions > 0}
          >
            Delete
          </ActionButton>
        </div>
      )
    }
  ];

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
          value={plans.filter(p => p.isActive).length}
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

      {/* Plans Table */}
      <ModernTable
        columns={tableColumns}
        data={plans}
        loading={loading}
        emptyMessage="Create your first subscription plan to get started"
        emptyIcon={CurrencyDollarIcon}
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