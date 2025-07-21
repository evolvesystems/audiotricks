import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { PlanFormData } from './types';

interface TeamTabProps {
  formData: PlanFormData;
  errors: Record<string, string>;
  onInputChange: (field: string, value: any) => void;
  onToggleFeature: (feature: string, isCollaboration: boolean) => void;
}

const collaborationFeatures = [
  'Team Projects',
  'Shared Workspaces',
  'User Roles & Permissions',
  'Team Analytics',
  'Collaborative Editing',
  'Activity Feed',
  'Team Templates',
  'Bulk User Management'
];

export default function TeamTab({ formData, errors, onInputChange, onToggleFeature }: TeamTabProps) {
  return (
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
              onChange={(e) => onInputChange('maxUsers', parseInt(e.target.value) || 1)}
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
              onChange={(e) => onInputChange('maxWorkspaces', parseInt(e.target.value) || 1)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-4">Collaboration Features</h4>
        <div className="space-y-2">
          {collaborationFeatures.map((feature) => (
            <label key={feature} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.collaborationFeatures.includes(feature)}
                onChange={() => onToggleFeature(feature, true)}
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