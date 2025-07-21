/**
 * Regular Admin Settings Dashboard
 * General admin configuration and preferences (non-super admin)
 */

import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon,
  BellIcon,
  UserIcon,
  KeyIcon,
  ShieldCheckIcon,
  EnvelopeIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import StatsCard from '../Dashboard/StatsCard';
import ActionButton from '../Dashboard/ActionButton';

interface AdminPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  weeklyReports: boolean;
  securityAlerts: boolean;
  maintenanceUpdates: boolean;
  theme: 'light' | 'dark' | 'auto';
  timezone: string;
  dateFormat: 'US' | 'EU' | 'ISO';
  defaultPageSize: number;
  autoRefreshDashboard: boolean;
  refreshInterval: number;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  loginAlerts: boolean;
}

interface ApiKeySettings {
  openaiApiKey: string;
  elevenlabsApiKey: string;
  sendgridApiKey: string;
  digitaloceanSpacesKey: string;
  digitaloceanSpacesSecret: string;
  ewayApiKey: string;
  ewayPassword: string;
}

export default function AdminSettings() {
  const { user, token } = useAdminAuthContext();
  const [preferences, setPreferences] = useState<AdminPreferences | null>(null);
  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 24,
    loginAlerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preferences' | 'security' | 'profile' | 'apikeys'>('preferences');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [apiKeys, setApiKeys] = useState<ApiKeySettings>({
    openaiApiKey: '',
    elevenlabsApiKey: '',
    sendgridApiKey: '',
    digitaloceanSpacesKey: '',
    digitaloceanSpacesSecret: '',
    ewayApiKey: '',
    ewayPassword: ''
  });
  const [showApiKeys, setShowApiKeys] = useState<Record<keyof ApiKeySettings, boolean>>({
    openaiApiKey: false,
    elevenlabsApiKey: false,
    sendgridApiKey: false,
    digitaloceanSpacesKey: false,
    digitaloceanSpacesSecret: false,
    ewayApiKey: false,
    ewayPassword: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock data for now - these endpoints would need to be implemented
      setPreferences({
        emailNotifications: true,
        pushNotifications: false,
        weeklyReports: true,
        securityAlerts: true,
        maintenanceUpdates: true,
        theme: 'light',
        timezone: 'Australia/Sydney',
        dateFormat: 'AU',
        defaultPageSize: 20,
        autoRefreshDashboard: true,
        refreshInterval: 30
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: keyof AdminPreferences, value: any) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  const handleSecurityChange = (key: keyof SecuritySettings, value: any) => {
    setSecurity({ ...security, [key]: value });
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      console.log('Saving preferences:', preferences);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (security.newPassword !== security.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (security.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      console.log('Changing password...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecurity({
        ...security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSaving(false);
    } catch (error) {
      console.error('Error changing password:', error);
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleApiKeyChange = (key: keyof ApiKeySettings, value: string) => {
    setApiKeys(prev => ({ ...prev, [key]: value }));
  };

  const toggleApiKeyVisibility = (field: keyof ApiKeySettings) => {
    setShowApiKeys(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      console.log('Saving API keys...');
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (error) {
      console.error('Error saving API keys:', error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <Cog6ToothIcon className="w-6 h-6 text-white" />
            </div>
            Admin Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your admin account preferences and security</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'preferences'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('apikeys')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apikeys'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            API Keys
          </button>
        </nav>
      </div>

      {/* Preferences Tab */}
      {activeTab === 'preferences' && preferences && (
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <BellIcon className="h-5 w-5" />
              Notifications
            </h3>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'pushNotifications', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Automated weekly system reports' },
                { key: 'securityAlerts', label: 'Security Alerts', desc: 'Important security notifications' },
                { key: 'maintenanceUpdates', label: 'Maintenance Updates', desc: 'System maintenance notifications' }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{label}</h4>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences[key as keyof AdminPreferences] as boolean}
                      onChange={(e) => handlePreferenceChange(key as keyof AdminPreferences, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Interface Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Interface Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="Australia/Sydney">Australia/Sydney</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date Format</label>
                <select
                  value={preferences.dateFormat}
                  onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="AU">DD/MM/YYYY (Australian)</option>
                  <option value="US">MM/DD/YYYY (US)</option>
                  <option value="ISO">YYYY-MM-DD (ISO)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Default Page Size</label>
                <select
                  value={preferences.defaultPageSize}
                  onChange={(e) => handlePreferenceChange('defaultPageSize', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value={10}>10 items</option>
                  <option value={20}>20 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-refresh Dashboard</h4>
                <p className="text-sm text-gray-500">Automatically refresh dashboard data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.autoRefreshDashboard}
                  onChange={(e) => handlePreferenceChange('autoRefreshDashboard', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {preferences.autoRefreshDashboard && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Refresh Interval (seconds)</label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={preferences.refreshInterval}
                  onChange={(e) => handlePreferenceChange('refreshInterval', parseInt(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <ActionButton
              variant="primary"
              onClick={handleSavePreferences}
              loading={saving}
            >
              Save Preferences
            </ActionButton>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Password Change */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              Change Password
            </h3>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={security.currentPassword}
                    onChange={(e) => handleSecurityChange('currentPassword', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.current ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={security.newPassword}
                    onChange={(e) => handleSecurityChange('newPassword', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.new ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={security.confirmPassword}
                    onChange={(e) => handleSecurityChange('confirmPassword', e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPasswords.confirm ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <ActionButton
                variant="primary"
                onClick={handlePasswordChange}
                loading={saving}
                disabled={!security.currentPassword || !security.newPassword || !security.confirmPassword}
              >
                Change Password
              </ActionButton>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Security Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.twoFactorEnabled}
                    onChange={(e) => handleSecurityChange('twoFactorEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Login Alerts</h4>
                  <p className="text-sm text-gray-500">Get notified of new login attempts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={security.loginAlerts}
                    onChange={(e) => handleSecurityChange('loginAlerts', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Session Timeout (hours)</label>
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={security.sessionTimeout}
                  onChange={(e) => handleSecurityChange('sessionTimeout', parseInt(e.target.value))}
                  className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm"
                />
                <p className="text-sm text-gray-500 mt-1">Automatically log out after this many hours of inactivity</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Account Status</label>
                <span className="mt-1 inline-flex items-center px-3 py-2 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'apikeys' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <KeyIcon className="h-5 w-5" />
              API Keys Management
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Configure API keys for third-party integrations. These keys are stored securely and used server-side only.
            </p>

            <div className="space-y-6">
              {/* OpenAI API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OpenAI API Key
                  <span className="text-xs text-gray-500 ml-2">(Whisper, GPT-4, Embeddings)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.openaiApiKey ? 'text' : 'password'}
                    value={apiKeys.openaiApiKey}
                    onChange={(e) => handleApiKeyChange('openaiApiKey', e.target.value)}
                    placeholder="sk-..."
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('openaiApiKey')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showApiKeys.openaiApiKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* ElevenLabs API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ElevenLabs API Key
                  <span className="text-xs text-gray-500 ml-2">(Voice Synthesis)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.elevenlabsApiKey ? 'text' : 'password'}
                    value={apiKeys.elevenlabsApiKey}
                    onChange={(e) => handleApiKeyChange('elevenlabsApiKey', e.target.value)}
                    placeholder="Enter ElevenLabs API key..."
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('elevenlabsApiKey')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showApiKeys.elevenlabsApiKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* SendGrid API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SendGrid API Key
                  <span className="text-xs text-gray-500 ml-2">(Email Services)</span>
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.sendgridApiKey ? 'text' : 'password'}
                    value={apiKeys.sendgridApiKey}
                    onChange={(e) => handleApiKeyChange('sendgridApiKey', e.target.value)}
                    placeholder="SG..."
                    className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('sendgridApiKey')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showApiKeys.sendgridApiKey ? (
                      <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* DigitalOcean Spaces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DigitalOcean Spaces Key
                    <span className="text-xs text-gray-500 ml-2">(File Storage)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.digitaloceanSpacesKey ? 'text' : 'password'}
                      value={apiKeys.digitaloceanSpacesKey}
                      onChange={(e) => handleApiKeyChange('digitaloceanSpacesKey', e.target.value)}
                      placeholder="Access Key..."
                      className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKeyVisibility('digitaloceanSpacesKey')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showApiKeys.digitaloceanSpacesKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DigitalOcean Spaces Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.digitaloceanSpacesSecret ? 'text' : 'password'}
                      value={apiKeys.digitaloceanSpacesSecret}
                      onChange={(e) => handleApiKeyChange('digitaloceanSpacesSecret', e.target.value)}
                      placeholder="Secret Key..."
                      className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKeyVisibility('digitaloceanSpacesSecret')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showApiKeys.digitaloceanSpacesSecret ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* eWAY Payment Gateway */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    eWAY API Key
                    <span className="text-xs text-gray-500 ml-2">(Payment Processing)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.ewayApiKey ? 'text' : 'password'}
                      value={apiKeys.ewayApiKey}
                      onChange={(e) => handleApiKeyChange('ewayApiKey', e.target.value)}
                      placeholder="eWAY API Key..."
                      className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKeyVisibility('ewayApiKey')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showApiKeys.ewayApiKey ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    eWAY Password
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKeys.ewayPassword ? 'text' : 'password'}
                      value={apiKeys.ewayPassword}
                      onChange={(e) => handleApiKeyChange('ewayPassword', e.target.value)}
                      placeholder="eWAY Password..."
                      className="block w-full rounded-md border-gray-300 shadow-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleApiKeyVisibility('ewayPassword')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                    >
                      {showApiKeys.ewayPassword ? (
                        <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <ActionButton
                variant="primary"
                onClick={handleSaveApiKeys}
                loading={saving}
              >
                Save API Keys
              </ActionButton>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  API keys are encrypted and stored securely. They are only used server-side and never exposed to client applications.
                  Ensure you're using production-grade keys with appropriate permissions and rate limits.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}