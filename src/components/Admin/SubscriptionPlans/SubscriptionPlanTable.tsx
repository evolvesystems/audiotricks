/**
 * SubscriptionPlanTable Component
 * Table display and column definitions for subscription plans
 */

import React from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  CurrencyDollarIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import ModernTable from '../Dashboard/ModernTable';
import ActionButton from '../Dashboard/ActionButton';

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

interface SubscriptionPlanTableProps {
  plans: SubscriptionPlan[];
  loading: boolean;
  onEditPlan: (plan: SubscriptionPlan) => void;
  onDeletePlan: (planId: string) => void;
}

export default function SubscriptionPlanTable({ 
  plans, 
  loading, 
  onEditPlan, 
  onDeletePlan 
}: SubscriptionPlanTableProps) {
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'pro': return 'bg-green-100 text-green-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
            onClick={() => onEditPlan(row)}
          >
            Edit
          </ActionButton>
          <ActionButton
            variant="danger"
            size="sm"
            icon={TrashIcon}
            onClick={() => onDeletePlan(row.id)}
            disabled={row.activeSubscriptions > 0}
          >
            Delete
          </ActionButton>
        </div>
      )
    }
  ];

  return (
    <ModernTable
      columns={tableColumns}
      data={plans}
      loading={loading}
      emptyMessage="Create your first subscription plan to get started"
      emptyIcon={CurrencyDollarIcon}
    />
  );
}