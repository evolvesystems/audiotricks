/**
 * Plan Creation and Editing Modal
 * Modal for creating new subscription plans or editing existing ones
 */

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';

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
  
  // Basic Limits
  maxApiCalls: number;
  maxStorageMb: number;
  maxProcessingMin: number;
  maxFileSize: number;
  
  // Transcription Limits
  maxTranscriptionsMonthly: number;
  maxFilesDaily: number;
  maxFilesMonthly: number;
  maxAudioDurationMinutes: number;
  maxConcurrentJobs: number;
  maxVoiceSynthesisMonthly: number;
  maxExportOperationsMonthly: number;
  
  // Team Features
  maxWorkspaces: number;
  maxUsers: number;
  
  // Other
  priorityLevel: number;
  features: string[];
  collaborationFeatures: string[];
  isActive: boolean;
  isPublic: boolean;
  planCategory: string;
  
  // Legacy fields for compatibility
  audioProcessingLimit?: number;
  storageLimit?: number;
  apiCallsLimit?: number;
  advancedFeatures?: boolean;
  customBranding?: boolean;
  prioritySupport?: boolean;
  activeSubscriptions?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<SubscriptionPlan>) => Promise<void>;
  plan?: SubscriptionPlan | null;
  token: string;
}

const initialFormData = {
  name: '',
  displayName: '',
  tier: 'personal',
  description: '',
  price: 0,
  priceAUD: 0,
  priceUSD: 0,
  priceEUR: 0,
  currency: 'AUD',
  billingInterval: 'monthly',
  
  // Basic Limits
  maxApiCalls: 1000,
  maxStorageMb: 1024,
  maxProcessingMin: 60,
  maxFileSize: 157286400, // 150MB
  
  // Transcription Limits
  maxTranscriptionsMonthly: 50,
  maxFilesDaily: 10,
  maxFilesMonthly: 100,
  maxAudioDurationMinutes: 120,
  maxConcurrentJobs: 1,
  maxVoiceSynthesisMonthly: 10,
  maxExportOperationsMonthly: 50,
  
  // Team Features
  maxWorkspaces: 1,
  maxUsers: 1,
  
  // Other
  priorityLevel: 5,
  features: [],
  collaborationFeatures: [],
  isActive: true,
  isPublic: true,
  planCategory: 'personal'
};

export default function PlanModal({ isOpen, onClose, onSave, plan, token }: PlanModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!plan;

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        displayName: plan.displayName || plan.name,
        tier: plan.tier,
        description: plan.description,
        price: plan.price || plan.priceAUD || 0,
        priceAUD: plan.priceAUD || plan.price || 0,
        priceUSD: plan.priceUSD || 0,
        priceEUR: plan.priceEUR || 0,
        currency: plan.currency || 'AUD',
        billingInterval: plan.billingInterval || 'monthly',
        
        // Basic Limits
        maxApiCalls: plan.maxApiCalls || plan.apiCallsLimit || 1000,
        maxStorageMb: plan.maxStorageMb || (plan.storageLimit ? plan.storageLimit * 1024 : 1024),
        maxProcessingMin: plan.maxProcessingMin || 60,
        maxFileSize: plan.maxFileSize || 157286400,
        
        // Transcription Limits
        maxTranscriptionsMonthly: plan.maxTranscriptionsMonthly || plan.audioProcessingLimit || 50,
        maxFilesDaily: plan.maxFilesDaily || 10,
        maxFilesMonthly: plan.maxFilesMonthly || 100,
        maxAudioDurationMinutes: plan.maxAudioDurationMinutes || 120,
        maxConcurrentJobs: plan.maxConcurrentJobs || 1,
        maxVoiceSynthesisMonthly: plan.maxVoiceSynthesisMonthly || 10,
        maxExportOperationsMonthly: plan.maxExportOperationsMonthly || 50,
        
        // Team Features
        maxWorkspaces: plan.maxWorkspaces || 1,
        maxUsers: plan.maxUsers || 1,
        
        // Other
        priorityLevel: plan.priorityLevel || 5,
        features: plan.features || [],
        collaborationFeatures: plan.collaborationFeatures || [],
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        isPublic: plan.isPublic !== undefined ? plan.isPublic : true,
        planCategory: plan.planCategory || 'personal'
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [plan, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Plan name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.priceAUD < 0) {
      newErrors.priceAUD = 'Price must be non-negative';
    }
    if (formData.priceUSD < 0) {
      newErrors.priceUSD = 'Price must be non-negative';
    }
    if (formData.priceEUR < 0) {
      newErrors.priceEUR = 'Price must be non-negative';
    }
    if (formData.audioProcessingLimit <= 0) {
      newErrors.audioProcessingLimit = 'Audio processing limit must be positive';
    }
    if (formData.storageLimit <= 0) {
      newErrors.storageLimit = 'Storage limit must be positive';
    }
    if (formData.apiCallsLimit <= 0) {
      newErrors.apiCallsLimit = 'API calls limit must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5" />
            {isEditing ? 'Edit Subscription Plan' : 'Create New Plan'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Basic Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.name ? 'border-red-300' : ''
                  }`}
                  placeholder="e.g., Professional Plan"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tier</label>
                <select
                  value={formData.tier}
                  onChange={(e) => handleInputChange('tier', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                  errors.description ? 'border-red-300' : ''
                }`}
                placeholder="Describe what this plan offers..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Pricing</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Price (AUD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceAUD}
                  onChange={(e) => handleInputChange('priceAUD', parseFloat(e.target.value) || 0)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.priceAUD ? 'border-red-300' : ''
                  }`}
                />
                {errors.priceAUD && <p className="mt-1 text-sm text-red-600">{errors.priceAUD}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceUSD}
                  onChange={(e) => handleInputChange('priceUSD', parseFloat(e.target.value) || 0)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.priceUSD ? 'border-red-300' : ''
                  }`}
                />
                {errors.priceUSD && <p className="mt-1 text-sm text-red-600">{errors.priceUSD}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.priceEUR}
                  onChange={(e) => handleInputChange('priceEUR', parseFloat(e.target.value) || 0)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.priceEUR ? 'border-red-300' : ''
                  }`}
                />
                {errors.priceEUR && <p className="mt-1 text-sm text-red-600">{errors.priceEUR}</p>}
              </div>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Usage Limits</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Audio Processing Limit</label>
                <input
                  type="number"
                  min="1"
                  value={formData.audioProcessingLimit}
                  onChange={(e) => handleInputChange('audioProcessingLimit', parseInt(e.target.value) || 1)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.audioProcessingLimit ? 'border-red-300' : ''
                  }`}
                />
                <p className="text-xs text-gray-500">Files per month</p>
                {errors.audioProcessingLimit && <p className="mt-1 text-sm text-red-600">{errors.audioProcessingLimit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Storage Limit (GB)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.storageLimit}
                  onChange={(e) => handleInputChange('storageLimit', parseInt(e.target.value) || 1)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.storageLimit ? 'border-red-300' : ''
                  }`}
                />
                {errors.storageLimit && <p className="mt-1 text-sm text-red-600">{errors.storageLimit}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">API Calls Limit</label>
                <input
                  type="number"
                  min="1"
                  value={formData.apiCallsLimit}
                  onChange={(e) => handleInputChange('apiCallsLimit', parseInt(e.target.value) || 1)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                    errors.apiCallsLimit ? 'border-red-300' : ''
                  }`}
                />
                <p className="text-xs text-gray-500">Calls per month</p>
                {errors.apiCallsLimit && <p className="mt-1 text-sm text-red-600">{errors.apiCallsLimit}</p>}
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Features</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.advancedFeatures}
                  onChange={(e) => handleInputChange('advancedFeatures', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Advanced Features</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.customBranding}
                  onChange={(e) => handleInputChange('customBranding', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Custom Branding</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.prioritySupport}
                  onChange={(e) => handleInputChange('prioritySupport', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Priority Support</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active (Available to users)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <ActionButton
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </ActionButton>
            <ActionButton
              variant="primary"
              type="submit"
              loading={saving}
              icon={CheckIcon}
            >
              {isEditing ? 'Update Plan' : 'Create Plan'}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}