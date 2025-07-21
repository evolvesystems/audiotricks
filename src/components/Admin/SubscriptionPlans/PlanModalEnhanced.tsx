/**
 * Enhanced Plan Creation and Editing Modal
 * Includes transcription limits and team features
 */

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CurrencyDollarIcon,
  CheckIcon,
  UsersIcon,
  DocumentTextIcon,
  ServerIcon
} from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';

interface SubscriptionPlan {
  id: string;
  name: string;
  displayName?: string;
  tier: string;
  description: string;
  price: number;
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

export default function PlanModalEnhanced({ isOpen, onClose, onSave, plan, token }: PlanModalProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'limits' | 'team' | 'features'>('basic');

  const isEditing = !!plan;

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        displayName: plan.displayName || plan.name,
        tier: plan.tier,
        description: plan.description,
        price: plan.price || 0,
        currency: plan.currency || 'AUD',
        billingInterval: plan.billingInterval || 'monthly',
        maxApiCalls: plan.maxApiCalls || 1000,
        maxStorageMb: plan.maxStorageMb || 1024,
        maxProcessingMin: plan.maxProcessingMin || 60,
        maxFileSize: plan.maxFileSize || 157286400,
        maxTranscriptionsMonthly: plan.maxTranscriptionsMonthly || 50,
        maxFilesDaily: plan.maxFilesDaily || 10,
        maxFilesMonthly: plan.maxFilesMonthly || 100,
        maxAudioDurationMinutes: plan.maxAudioDurationMinutes || 120,
        maxConcurrentJobs: plan.maxConcurrentJobs || 1,
        maxVoiceSynthesisMonthly: plan.maxVoiceSynthesisMonthly || 10,
        maxExportOperationsMonthly: plan.maxExportOperationsMonthly || 50,
        maxWorkspaces: plan.maxWorkspaces || 1,
        maxUsers: plan.maxUsers || 1,
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
    if (formData.price < 0) {
      newErrors.price = 'Price must be non-negative';
    }
    if (formData.maxTranscriptionsMonthly <= 0) {
      newErrors.maxTranscriptionsMonthly = 'Monthly transcriptions must be positive';
    }
    if (formData.maxUsers <= 0) {
      newErrors.maxUsers = 'Maximum users must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (feature: string, isCollaboration: boolean = false) => {
    const fieldName = isCollaboration ? 'collaborationFeatures' : 'features';
    const currentFeatures = formData[fieldName];
    
    if (currentFeatures.includes(feature)) {
      handleInputChange(fieldName, currentFeatures.filter(f => f !== feature));
    } else {
      handleInputChange(fieldName, [...currentFeatures, feature]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px px-6">
            {(['basic', 'limits', 'team', 'features'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
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
                    placeholder="e.g., Professional"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange('displayName', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Professional Plan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Plan Category</label>
                  <select
                    value={formData.planCategory}
                    onChange={(e) => handleInputChange('planCategory', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tier</label>
                  <select
                    value={formData.tier}
                    onChange={(e) => handleInputChange('tier', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="free">Free</option>
                    <option value="personal">Personal</option>
                    <option value="business">Business</option>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      errors.price ? 'border-red-300' : ''
                    }`}
                  />
                  {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="AUD">AUD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Billing Interval</label>
                  <select
                    value={formData.billingInterval}
                    onChange={(e) => handleInputChange('billingInterval', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Active (Available to users)</span>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Public (Visible on pricing page)</span>
                </label>
              </div>
            </div>
          )}

          {/* Limits Tab */}
          {activeTab === 'limits' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Transcription Limits
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Transcriptions</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxTranscriptionsMonthly}
                      onChange={(e) => handleInputChange('maxTranscriptionsMonthly', parseInt(e.target.value) || 0)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.maxTranscriptionsMonthly ? 'border-red-300' : ''
                      }`}
                    />
                    <p className="text-xs text-gray-500">0 = unlimited</p>
                    {errors.maxTranscriptionsMonthly && <p className="mt-1 text-sm text-red-600">{errors.maxTranscriptionsMonthly}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Daily File Uploads</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxFilesDaily}
                      onChange={(e) => handleInputChange('maxFilesDaily', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">0 = unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly File Uploads</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxFilesMonthly}
                      onChange={(e) => handleInputChange('maxFilesMonthly', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">0 = unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Audio Duration (min)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxAudioDurationMinutes}
                      onChange={(e) => handleInputChange('maxAudioDurationMinutes', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">Per file, 0 = unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Concurrent Jobs</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxConcurrentJobs}
                      onChange={(e) => handleInputChange('maxConcurrentJobs', parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Voice Synthesis</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxVoiceSynthesisMonthly}
                      onChange={(e) => handleInputChange('maxVoiceSynthesisMonthly', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <ServerIcon className="h-4 w-4" />
                  System Resources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Storage (MB)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxStorageMb}
                      onChange={(e) => handleInputChange('maxStorageMb', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">API Calls/Month</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxApiCalls}
                      onChange={(e) => handleInputChange('maxApiCalls', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Processing Min/Month</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxProcessingMin}
                      onChange={(e) => handleInputChange('maxProcessingMin', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max File Size (MB)</label>
                    <input
                      type="number"
                      min="1"
                      value={Math.round(formData.maxFileSize / 1048576)}
                      onChange={(e) => handleInputChange('maxFileSize', (parseInt(e.target.value) || 1) * 1048576)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Exports</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxExportOperationsMonthly}
                      onChange={(e) => handleInputChange('maxExportOperationsMonthly', parseInt(e.target.value) || 0)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority Level</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priorityLevel}
                      onChange={(e) => handleInputChange('priorityLevel', parseInt(e.target.value) || 5)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">1-10 (higher = faster)</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Team & Collaboration
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Users</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxUsers}
                      onChange={(e) => handleInputChange('maxUsers', parseInt(e.target.value) || 1)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                        errors.maxUsers ? 'border-red-300' : ''
                      }`}
                    />
                    <p className="text-xs text-gray-500">Per workspace</p>
                    {errors.maxUsers && <p className="mt-1 text-sm text-red-600">{errors.maxUsers}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Maximum Workspaces</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxWorkspaces}
                      onChange={(e) => handleInputChange('maxWorkspaces', parseInt(e.target.value) || 1)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Collaboration Features</h4>
                <div className="space-y-2">
                  {[
                    'Team Projects',
                    'Shared Workspaces',
                    'User Roles & Permissions',
                    'Team Analytics',
                    'Collaborative Editing',
                    'Activity Feed',
                    'Team Templates',
                    'Bulk User Management'
                  ].map((feature) => (
                    <label key={feature} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.collaborationFeatures.includes(feature)}
                        onChange={() => toggleFeature(feature, true)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">General Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    'Advanced Transcription',
                    'Custom Vocabulary',
                    'Speaker Diarization',
                    'Sentiment Analysis',
                    'Key Points Extraction',
                    'Multi-language Support',
                    'API Access',
                    'Webhook Integration',
                    'Custom Branding',
                    'Priority Support',
                    'SLA Guarantee',
                    'Dedicated Account Manager',
                    'Custom AI Models',
                    'White-label Options',
                    'Advanced Analytics',
                    'Export to Multiple Formats'
                  ].map((feature) => (
                    <label key={feature} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formData.features.includes(feature)}
                        onChange={() => toggleFeature(feature, false)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
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