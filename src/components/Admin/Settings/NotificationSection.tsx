import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { AdminPreferences } from './types';

interface NotificationSectionProps {
  preferences: AdminPreferences;
  onChange: (updates: Partial<AdminPreferences>) => void;
}

export default function NotificationSection({
  preferences,
  onChange
}: NotificationSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <BellIcon className="h-5 w-5 mr-2" />
        Notification Preferences
      </h3>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="emailNotifications"
            checked={preferences.emailNotifications}
            onChange={(e) => onChange({ emailNotifications: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-700">
            Email notifications for important updates
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="pushNotifications"
            checked={preferences.pushNotifications}
            onChange={(e) => onChange({ pushNotifications: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="pushNotifications" className="ml-2 block text-sm text-gray-700">
            Push notifications to browser
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="weeklyReports"
            checked={preferences.weeklyReports}
            onChange={(e) => onChange({ weeklyReports: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="weeklyReports" className="ml-2 block text-sm text-gray-700">
            Weekly activity reports
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="securityAlerts"
            checked={preferences.securityAlerts}
            onChange={(e) => onChange({ securityAlerts: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="securityAlerts" className="ml-2 block text-sm text-gray-700">
            Security alerts and warnings
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="maintenanceUpdates"
            checked={preferences.maintenanceUpdates}
            onChange={(e) => onChange({ maintenanceUpdates: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="maintenanceUpdates" className="ml-2 block text-sm text-gray-700">
            Maintenance and downtime notifications
          </label>
        </div>
      </div>
    </div>
  );
}