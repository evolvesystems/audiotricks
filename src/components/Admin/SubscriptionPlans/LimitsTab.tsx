import React from 'react';
import { DocumentTextIcon, ServerIcon } from '@heroicons/react/24/outline';
import { PlanFormData } from './types';

interface LimitsTabProps {
  formData: PlanFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
}

export default function LimitsTab({ formData, errors, onInputChange }: LimitsTabProps) {
  return (
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
              onChange={(e) => onInputChange('maxTranscriptionsMonthly', parseInt(e.target.value) || 0)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                errors.maxTranscriptionsMonthly ? 'border-red-300' : ''
              }`}
            />
            <p className="text-xs text-gray-500">0 = unlimited</p>
            {errors.maxTranscriptionsMonthly && (
              <p className="mt-1 text-sm text-red-600">{errors.maxTranscriptionsMonthly}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Daily File Uploads</label>
            <input
              type="number"
              min="0"
              value={formData.maxFilesDaily}
              onChange={(e) => onInputChange('maxFilesDaily', parseInt(e.target.value) || 0)}
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
              onChange={(e) => onInputChange('maxFilesMonthly', parseInt(e.target.value) || 0)}
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
              onChange={(e) => onInputChange('maxAudioDurationMinutes', parseInt(e.target.value) || 0)}
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
              onChange={(e) => onInputChange('maxConcurrentJobs', parseInt(e.target.value) || 1)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Voice Synthesis</label>
            <input
              type="number"
              min="0"
              value={formData.maxVoiceSynthesisMonthly}
              onChange={(e) => onInputChange('maxVoiceSynthesisMonthly', parseInt(e.target.value) || 0)}
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
              onChange={(e) => onInputChange('maxStorageMb', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">API Calls/Month</label>
            <input
              type="number"
              min="0"
              value={formData.maxApiCalls}
              onChange={(e) => onInputChange('maxApiCalls', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Processing Min/Month</label>
            <input
              type="number"
              min="0"
              value={formData.maxProcessingMin}
              onChange={(e) => onInputChange('maxProcessingMin', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max File Size (MB)</label>
            <input
              type="number"
              min="1"
              value={Math.round(formData.maxFileSize / 1048576)}
              onChange={(e) => onInputChange('maxFileSize', (parseInt(e.target.value) || 1) * 1048576)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Exports</label>
            <input
              type="number"
              min="0"
              value={formData.maxExportOperationsMonthly}
              onChange={(e) => onInputChange('maxExportOperationsMonthly', parseInt(e.target.value) || 0)}
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
              onChange={(e) => onInputChange('priorityLevel', parseInt(e.target.value) || 5)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">1-10 (higher = faster)</p>
          </div>
        </div>
      </div>
    </div>
  );
}