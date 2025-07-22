/**
 * Regular Admin Settings Dashboard
 * General admin configuration and preferences (non-super admin)
 */

import React, { useState, useEffect } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';
import PreferencesSection from './PreferencesSection';
import NotificationSection from './NotificationSection';
import ApiKeySection from './ApiKeySection';
import TabNavigation, { TabType } from './TabNavigation';
import { 
  AdminPreferences, 
  SecuritySettings, 
  ApiKeySettings,
  AdminProfile 
} from './types';
import { logger } from '../../../utils/logger';

export default function AdminSettings() {
  const { user } = useAdminAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('preferences');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState<AdminProfile>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    department: '',
    role: user?.role || 'admin'
  });

  // Preferences state
  const [preferences, setPreferences] = useState<AdminPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true,
    maintenanceUpdates: true,
    theme: 'light',
    timezone: 'Australia/Sydney',
    dateFormat: 'EU',
    defaultPageSize: 20,
    autoRefreshDashboard: true,
    refreshInterval: 30
  });

  // Security state
  const [security, setSecurity] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
    sessionTimeout: 30,
    loginAlerts: true
  });

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeySettings>({
    openaiApiKey: '',
    elevenlabsApiKey: '',
    sendgridApiKey: '',
    digitaloceanSpacesKey: '',
    digitaloceanSpacesSecret: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
    ewayApiKey: '',
    ewayApiPassword: ''
  });

  const [showApiKeys, setShowApiKeys] = useState<Record<keyof ApiKeySettings, boolean>>({
    openaiApiKey: false,
    elevenlabsApiKey: false,
    sendgridApiKey: false,
    digitaloceanSpacesKey: false,
    digitaloceanSpacesSecret: false,
    stripePublishableKey: false,
    stripeSecretKey: false,
    ewayApiKey: false,
    ewayApiPassword: false
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Mock data for now - these endpoints would need to be implemented
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching admin settings:', error);
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      logger.log('Saving preferences:', preferences);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (error) {
      logger.error('Error saving preferences:', error);
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (security.newPassword !== security.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      logger.log('Changing password...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecurity({
        ...security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSaving(false);
    } catch (error) {
      logger.error('Error changing password:', error);
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    setSaving(true);
    try {
      logger.log('Toggling 2FA...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSecurity({ ...security, twoFactorEnabled: !security.twoFactorEnabled });
      setSaving(false);
    } catch (error) {
      logger.error('Error toggling 2FA:', error);
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      logger.log('Saving profile:', profile);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEditingProfile(false);
      setSaving(false);
    } catch (error) {
      logger.error('Error saving profile:', error);
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    setSaving(true);
    try {
      logger.log('Saving API keys...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaving(false);
    } catch (error) {
      logger.error('Error saving API keys:', error);
      setSaving(false);
    }
  };

  const toggleApiKeyVisibility = (field: keyof ApiKeySettings) => {
    setShowApiKeys(prev => ({ ...prev, [field]: !prev[field] }));
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
          <p className="text-gray-600 mt-2">
            Manage your admin account preferences and security
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <NotificationSection
            preferences={preferences}
            onChange={(updates) => setPreferences({ ...preferences, ...updates })}
          />
          <PreferencesSection
            preferences={preferences}
            onChange={(key, value) => setPreferences({ ...preferences, [key]: value })}
            onSave={handleSavePreferences}
            saving={saving}
          />
        </div>
      )}

      {activeTab === 'security' && (
        <SecuritySection
          security={security}
          onChange={(updates) => setSecurity({ ...security, ...updates })}
          onPasswordChange={handlePasswordChange}
          onToggle2FA={handleToggle2FA}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileSection
          profile={profile}
          editingProfile={editingProfile}
          onChange={(updates) => setProfile({ ...profile, ...updates })}
          onSave={handleSaveProfile}
          onCancel={() => setEditingProfile(false)}
          onEdit={() => setEditingProfile(true)}
        />
      )}

      {activeTab === 'apikeys' && (
        <ApiKeySection
          apiKeys={apiKeys}
          showApiKeys={showApiKeys}
          onChange={(key, value) => setApiKeys({ ...apiKeys, [key]: value })}
          onToggleVisibility={toggleApiKeyVisibility}
          onSave={handleSaveApiKeys}
          saving={saving}
        />
      )}
    </div>
  );
}