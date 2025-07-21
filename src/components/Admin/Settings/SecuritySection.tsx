import React, { useState } from 'react';
import { ShieldCheckIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import { SecuritySettings, PasswordRequirement } from './types';

interface SecuritySectionProps {
  security: SecuritySettings;
  onChange: (updates: Partial<SecuritySettings>) => void;
  onPasswordChange: () => void;
  onToggle2FA: () => void;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number', test: (p: string) => /\d/.test(p) },
  { label: 'One special character', test: (p: string) => /[!@#$%^&*]/.test(p) }
];

export default function SecuritySection({
  security,
  onChange,
  onPasswordChange,
  onToggle2FA
}: SecuritySectionProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <ShieldCheckIcon className="h-5 w-5 mr-2" />
        Security Settings
      </h3>

      <div className="space-y-6">
        {/* Password Change */}
        <div className="border-b pb-6">
          <h4 className="font-medium mb-4">Change Password</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Current Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={security.currentPassword}
                  onChange={(e) => onChange({ currentPassword: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={security.newPassword}
                  onChange={(e) => onChange({ newPassword: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={security.confirmPassword}
                  onChange={(e) => onChange({ confirmPassword: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {security.newPassword && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <li
                      key={index}
                      className={`text-sm flex items-center ${
                        req.test(security.newPassword)
                          ? 'text-green-600'
                          : 'text-gray-400'
                      }`}
                    >
                      <span className="mr-2">
                        {req.test(security.newPassword) ? '✓' : '○'}
                      </span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ActionButton
              onClick={onPasswordChange}
              variant="primary"
              disabled={!security.currentPassword || !security.newPassword || 
                       security.newPassword !== security.confirmPassword}
            >
              Update Password
            </ActionButton>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="border-b pb-6">
          <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Status: <span className={security.twoFactorEnabled ? 'text-green-600' : 'text-gray-600'}>
                  {security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </p>
            </div>
            <ActionButton
              onClick={onToggle2FA}
              variant={security.twoFactorEnabled ? 'secondary' : 'primary'}
            >
              {security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </ActionButton>
          </div>
        </div>

        {/* Session Settings */}
        <div>
          <h4 className="font-medium mb-4">Session Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={security.sessionTimeout}
                onChange={(e) => onChange({ sessionTimeout: parseInt(e.target.value) || 30 })}
                min="5"
                max="1440"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Automatically log out after this period of inactivity
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="loginAlerts"
                checked={security.loginAlerts}
                onChange={(e) => onChange({ loginAlerts: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="loginAlerts" className="ml-2 block text-sm text-gray-700">
                Send email alerts for new login attempts
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}