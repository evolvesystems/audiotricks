import React from 'react';
import { PlanFormData } from './types';

interface FeaturesTabProps {
  formData: PlanFormData;
  onToggleFeature: (feature: string, isCollaboration: boolean) => void;
}

const generalFeatures = [
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
];

export default function FeaturesTab({ formData, onToggleFeature }: FeaturesTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">General Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {generalFeatures.map((feature) => (
            <label key={feature} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.features.includes(feature)}
                onChange={() => onToggleFeature(feature, false)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{feature}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}