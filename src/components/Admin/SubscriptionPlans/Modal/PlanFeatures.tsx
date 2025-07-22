/**
 * Plan Features Form
 * Handles feature lists and collaboration features
 */

import React, { useState } from 'react';
import { CheckIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface SubscriptionPlan {
  features: string[];
  collaborationFeatures: string[];
  isActive: boolean;
}

interface PlanFeaturesProps {
  plan: Partial<SubscriptionPlan>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const PlanFeatures: React.FC<PlanFeaturesProps> = ({ plan, onChange, errors }) => {
  const [newFeature, setNewFeature] = useState('');
  const [newCollabFeature, setNewCollabFeature] = useState('');

  const commonFeatures = [
    'Audio Transcription',
    'Text Summarization',
    'Speaker Identification',
    'Multiple File Formats',
    'Cloud Storage',
    'API Access',
    'Export Options',
    'Voice Synthesis',
    'Real-time Processing',
    'Advanced Analytics',
    'Team Collaboration',
    'Custom Integrations',
    'Priority Support',
    'SLA Guarantee'
  ];

  const addFeature = (type: 'features' | 'collaborationFeatures') => {
    const newFeatureText = type === 'features' ? newFeature : newCollabFeature;
    if (!newFeatureText.trim()) return;

    const currentFeatures = plan[type] || [];
    if (!currentFeatures.includes(newFeatureText)) {
      onChange(type, [...currentFeatures, newFeatureText]);
    }

    if (type === 'features') {
      setNewFeature('');
    } else {
      setNewCollabFeature('');
    }
  };

  const removeFeature = (type: 'features' | 'collaborationFeatures', index: number) => {
    const currentFeatures = plan[type] || [];
    onChange(type, currentFeatures.filter((_, i) => i !== index));
  };

  const toggleCommonFeature = (feature: string) => {
    const currentFeatures = plan.features || [];
    if (currentFeatures.includes(feature)) {
      onChange('features', currentFeatures.filter(f => f !== feature));
    } else {
      onChange('features', [...currentFeatures, feature]);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Features & Settings</h3>
      
      {/* Plan Status */}
      <div className="flex items-center space-x-3">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={plan.isActive !== false}
            onChange={(e) => onChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Plan is active</span>
        </label>
      </div>

      {/* Common Features */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Common Features</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonFeatures.map((feature) => (
            <label key={feature} className="flex items-center">
              <input
                type="checkbox"
                checked={(plan.features || []).includes(feature)}
                onChange={() => toggleCommonFeature(feature)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{feature}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Features */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Features</h4>
        <div className="space-y-2">
          {(plan.features || []).filter(f => !commonFeatures.includes(f)).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
              <CheckIcon className="h-4 w-4 text-green-500" />
              <span className="flex-1 text-sm">{feature}</span>
              <button
                type="button"
                onClick={() => removeFeature('features', (plan.features || []).indexOf(feature))}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add custom feature..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addFeature('features')}
            />
            <button
              type="button"
              onClick={() => addFeature('features')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Collaboration Features */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Collaboration Features</h4>
        <div className="space-y-2">
          {(plan.collaborationFeatures || []).map((feature, index) => (
            <div key={index} className="flex items-center space-x-2 bg-blue-50 p-2 rounded">
              <CheckIcon className="h-4 w-4 text-blue-500" />
              <span className="flex-1 text-sm">{feature}</span>
              <button
                type="button"
                onClick={() => removeFeature('collaborationFeatures', index)}
                className="text-red-500 hover:text-red-700"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newCollabFeature}
              onChange={(e) => setNewCollabFeature(e.target.value)}
              placeholder="Add collaboration feature..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addFeature('collaborationFeatures')}
            />
            <button
              type="button"
              onClick={() => addFeature('collaborationFeatures')}
              className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};