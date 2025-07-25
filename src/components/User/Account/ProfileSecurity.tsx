/**
 * Profile Security Component - Security settings for user profile
 */

import React from 'react';

export const ProfileSecurity: React.FC = () => {
  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Security</h4>
      <div className="space-y-4">
        <button className="w-full md:w-auto px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
          Change Password
        </button>
        <div className="text-sm text-gray-600">
          <p>Two-factor authentication: <span className="font-medium">Not enabled</span></p>
          <button className="text-blue-600 hover:text-blue-700 mt-1">Enable 2FA</button>
        </div>
      </div>
    </div>
  );
};