/**
 * Enhanced Plan Creation and Editing Modal
 * Includes transcription limits and team features
 */

import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import BasicInfoTab from './BasicInfoTab';
import LimitsTab from './LimitsTab';
import TeamTab from './TeamTab';
import FeaturesTab from './FeaturesTab';
import { SubscriptionPlan, PlanFormData, initialFormData } from './types';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (plan: Partial<SubscriptionPlan>) => Promise<void>;
  plan?: SubscriptionPlan | null;
  token: string;
}

type TabType = 'basic' | 'limits' | 'team' | 'features';

export default function PlanModalEnhanced({ isOpen, onClose, onSave, plan }: PlanModalProps) {
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<TabType>('basic');

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
      handleInputChange(fieldName, currentFeatures.filter((f: string) => f !== feature));
    } else {
      handleInputChange(fieldName, [...currentFeatures, feature]);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'limits', label: 'Limits' },
    { id: 'team', label: 'Team' },
    { id: 'features', label: 'Features' }
  ];

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
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`mr-8 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'basic' && (
            <BasicInfoTab
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}

          {activeTab === 'limits' && (
            <LimitsTab
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
            />
          )}

          {activeTab === 'team' && (
            <TeamTab
              formData={formData}
              errors={errors}
              onInputChange={handleInputChange}
              onToggleFeature={toggleFeature}
            />
          )}

          {activeTab === 'features' && (
            <FeaturesTab
              formData={formData}
              onToggleFeature={toggleFeature}
            />
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