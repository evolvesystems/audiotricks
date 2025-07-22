/**
 * Plan Creation and Editing Modal
 * Refactored modal for creating new subscription plans or editing existing ones
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import { PlanBasicInfo } from './Modal/PlanBasicInfo';
import { PlanPricing } from './Modal/PlanPricing';
import { PlanLimits } from './Modal/PlanLimits';
import { PlanFeatures } from './Modal/PlanFeatures';

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
  maxApiCalls: number;
  maxStorageMb: number;
  maxProcessingMin: number;
  maxFileSize: number;
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxFilesMonthly: number;
  maxAudioDurationMinutes: number;
  maxConcurrentJobs: number;
  maxVoiceSynthesisMonthly: number;
  maxExportOperationsMonthly: number;
  maxWorkspaces: number;
  maxUsers: number;
  priorityLevel: number;
  features: string[];
  collaborationFeatures: string[];
  isActive: boolean;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan | null;
  onSave: (plan: Partial<SubscriptionPlan>) => void;
}

const DEFAULT_PLAN: Partial<SubscriptionPlan> = {
  name: '',
  tier: '',
  description: '',
  price: 0,
  priceAUD: 0,
  priceUSD: 0,
  priceEUR: 0,
  currency: 'AUD',
  billingInterval: 'monthly',
  maxApiCalls: 1000,
  maxStorageMb: 1000,
  maxProcessingMin: 60,
  maxFileSize: 100,
  maxTranscriptionsMonthly: 50,
  maxFilesDaily: 10,
  maxFilesMonthly: 100,
  maxAudioDurationMinutes: 120,
  maxConcurrentJobs: 3,
  maxVoiceSynthesisMonthly: 20,
  maxExportOperationsMonthly: 50,
  maxWorkspaces: 1,
  maxUsers: 5,
  priorityLevel: 5,
  features: [],
  collaborationFeatures: [],
  isActive: true
};

export const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, plan, onSave }) => {
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>(DEFAULT_PLAN);
  const [activeTab, setActiveTab] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const tabs = ['Basic Info', 'Pricing', 'Limits', 'Features'];

  useEffect(() => {
    if (plan) {
      setFormData(plan);
    } else {
      setFormData(DEFAULT_PLAN);
    }
    setActiveTab(0);
    setErrors({});
  }, [plan, isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Plan name is required';
    }
    if (!formData.tier) {
      newErrors.tier = 'Tier is required';
    }
    if (!formData.billingInterval) {
      newErrors.billingInterval = 'Billing interval is required';
    }
    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Valid price is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ general: 'Failed to save plan. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <PlanBasicInfo plan={formData} onChange={handleChange} errors={errors} />;
      case 1:
        return <PlanPricing plan={formData} onChange={handleChange} errors={errors} />;
      case 2:
        return <PlanLimits plan={formData} onChange={handleChange} errors={errors} />;
      case 3:
        return <PlanFeatures plan={formData} onChange={handleChange} errors={errors} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          
          {renderTabContent()}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            {activeTab > 0 && (
              <button
                onClick={() => setActiveTab(activeTab - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {activeTab < tabs.length - 1 && (
              <button
                onClick={() => setActiveTab(activeTab + 1)}
                className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-md hover:bg-blue-100"
              >
                Next
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <ActionButton
              onClick={handleSave}
              disabled={isLoading}
              variant="primary"
            >
              {isLoading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </ActionButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanModal;