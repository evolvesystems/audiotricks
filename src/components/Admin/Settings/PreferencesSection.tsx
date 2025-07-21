import React from 'react';
import { CogIcon, PaintBrushIcon } from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import { AdminPreferences } from './types';

interface PreferencesSectionProps {
  preferences: AdminPreferences;
  onChange: (key: keyof AdminPreferences, value: any) => void;
  onSave: () => void;
  saving: boolean;
}

export default function PreferencesSection({
  preferences,
  onChange,
  onSave,
  saving
}: PreferencesSectionProps) {
  return (
    <div className="space-y-6">
      {/* Interface Settings */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <PaintBrushIcon className="h-5 w-5 mr-2" />
          Interface Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <select
              value={preferences.theme}
              onChange={(e) => onChange('theme', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => onChange('timezone', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="Australia/Sydney">Australia/Sydney</option>
              <option value="Australia/Melbourne">Australia/Melbourne</option>
              <option value="Australia/Brisbane">Australia/Brisbane</option>
              <option value="Australia/Perth">Australia/Perth</option>
              <option value="America/New_York">America/New_York</option>
              <option value="America/Los_Angeles">America/Los Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => onChange('dateFormat', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="US">MM/DD/YYYY (US)</option>
              <option value="EU">DD/MM/YYYY (EU/AU)</option>
              <option value="ISO">YYYY-MM-DD (ISO)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Default Page Size</label>
            <select
              value={preferences.defaultPageSize}
              onChange={(e) => onChange('defaultPageSize', parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value={10}>10 items</option>
              <option value={20}>20 items</option>
              <option value={50}>50 items</option>
              <option value={100}>100 items</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto-refresh Dashboard</h4>
              <p className="text-sm text-gray-500">Automatically refresh dashboard data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.autoRefreshDashboard}
                onChange={(e) => onChange('autoRefreshDashboard', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {preferences.autoRefreshDashboard && (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Refresh Interval (seconds)
              </label>
              <input
                type="number"
                min="10"
                max="300"
                value={preferences.refreshInterval}
                onChange={(e) => onChange('refreshInterval', parseInt(e.target.value) || 30)}
                className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                How often to refresh dashboard data (10-300 seconds)
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <ActionButton
          onClick={onSave}
          variant="primary"
          loading={saving}
        >
          Save Preferences
        </ActionButton>
      </div>
    </div>
  );
}