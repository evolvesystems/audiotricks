/**
 * Plan Limits Form
 * Handles usage limits and quotas
 */

import React from 'react';

interface SubscriptionPlan {
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
}

interface PlanLimitsProps {
  plan: Partial<SubscriptionPlan>;
  onChange: (field: string, value: any) => void;
  errors: Record<string, string>;
}

export const PlanLimits: React.FC<PlanLimitsProps> = ({ plan, onChange, errors }) => {
  const limitFields = [
    { key: 'maxApiCalls', label: 'Max API Calls/Month', placeholder: '1000' },
    { key: 'maxStorageMb', label: 'Max Storage (MB)', placeholder: '1024' },
    { key: 'maxProcessingMin', label: 'Max Processing Minutes/Month', placeholder: '60' },
    { key: 'maxFileSize', label: 'Max File Size (MB)', placeholder: '100' },
    { key: 'maxTranscriptionsMonthly', label: 'Max Transcriptions/Month', placeholder: '50' },
    { key: 'maxFilesDaily', label: 'Max Files/Day', placeholder: '10' },
    { key: 'maxFilesMonthly', label: 'Max Files/Month', placeholder: '100' },
    { key: 'maxAudioDurationMinutes', label: 'Max Audio Duration (minutes)', placeholder: '120' },
    { key: 'maxConcurrentJobs', label: 'Max Concurrent Jobs', placeholder: '3' },
    { key: 'maxVoiceSynthesisMonthly', label: 'Max Voice Synthesis/Month', placeholder: '20' },
    { key: 'maxExportOperationsMonthly', label: 'Max Exports/Month', placeholder: '50' },
    { key: 'maxWorkspaces', label: 'Max Workspaces', placeholder: '5' },
    { key: 'maxUsers', label: 'Max Users per Workspace', placeholder: '10' },
    { key: 'priorityLevel', label: 'Priority Level (1-10)', placeholder: '5' }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Usage Limits & Quotas</h3>
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          Set limits for various features and usage metrics. Use -1 for unlimited access.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {limitFields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label}
            </label>
            <input
              type="number"
              value={plan[key as keyof SubscriptionPlan] || ''}
              onChange={(e) => onChange(key, parseInt(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm ${
                errors[key] ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={placeholder}
              min="-1"
            />
            {errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Preset Configurations</h4>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              // Free tier presets
              onChange('maxApiCalls', 100);
              onChange('maxStorageMb', 100);
              onChange('maxProcessingMin', 10);
              onChange('maxFileSize', 25);
              onChange('maxTranscriptionsMonthly', 5);
              onChange('maxFilesDaily', 3);
              onChange('maxFilesMonthly', 10);
              onChange('priorityLevel', 1);
            }}
            className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Free Tier
          </button>
          <button
            type="button"
            onClick={() => {
              // Pro tier presets
              onChange('maxApiCalls', 10000);
              onChange('maxStorageMb', 5000);
              onChange('maxProcessingMin', 300);
              onChange('maxFileSize', 500);
              onChange('maxTranscriptionsMonthly', 200);
              onChange('maxFilesDaily', 50);
              onChange('maxFilesMonthly', 500);
              onChange('priorityLevel', 5);
            }}
            className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
          >
            Pro Tier
          </button>
          <button
            type="button"
            onClick={() => {
              // Enterprise tier presets
              onChange('maxApiCalls', -1);
              onChange('maxStorageMb', -1);
              onChange('maxProcessingMin', -1);
              onChange('maxFileSize', 2000);
              onChange('maxTranscriptionsMonthly', -1);
              onChange('maxFilesDaily', -1);
              onChange('maxFilesMonthly', -1);
              onChange('priorityLevel', 10);
            }}
            className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100"
          >
            Enterprise Tier
          </button>
        </div>
      </div>
    </div>
  );
};