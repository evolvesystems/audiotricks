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
import AdminSettingsService from '../../../services/adminSettings.service';

export default function AdminSettings() {
  const { user, token } = useAdminAuthContext();
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
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const settings = await AdminSettingsService.getSettings(token);
      
      // Update state with fetched settings
      if (settings.apiKeys) {
        setApiKeys(prev => ({ ...prev, ...settings.apiKeys }));
      }
      if (settings.preferences) {
        setPreferences(prev => ({ ...prev, ...settings.preferences }));
      }
      if (settings.profile) {
        setProfile(prev => ({ ...prev, ...settings.profile }));
      }
      
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching admin settings:', error);
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await AdminSettingsService.updatePreferences(token, preferences);
      logger.log('Preferences saved successfully');
      setSaving(false);
    } catch (error) {
      logger.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!token) return;
    if (security.newPassword !== security.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    setSaving(true);
    try {
      await AdminSettingsService.changePassword(token, security.currentPassword, security.newPassword);
      setSecurity({
        ...security,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      logger.log('Password changed successfully');
      alert('Password changed successfully');
      setSaving(false);
    } catch (error) {
      logger.error('Error changing password:', error);
      alert('Failed to change password. Please check your current password and try again.');
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const newState = !security.twoFactorEnabled;
      await AdminSettingsService.toggle2FA(token, newState);
      setSecurity({ ...security, twoFactorEnabled: newState });
      logger.log(`2FA ${newState ? 'enabled' : 'disabled'} successfully`);
      setSaving(false);
    } catch (error) {
      logger.error('Error toggling 2FA:', error);
      alert('Failed to update 2FA settings. Please try again.');
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await AdminSettingsService.updateProfile(token, profile);
      logger.log('Profile saved successfully');
      setEditingProfile(false);
      setSaving(false);
    } catch (error) {
      logger.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    if (!token) return;
    setSaving(true);
    try {
      // Only send non-empty API keys to avoid overwriting with empty values
      const keysToSave: Partial<ApiKeySettings> = {};
      Object.entries(apiKeys).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          keysToSave[key as keyof ApiKeySettings] = value;
        }
      });
      
      await AdminSettingsService.updateApiKeys(token, keysToSave);
      logger.log('API keys saved successfully');
      alert('API keys saved successfully!\n\nNote: OpenAI and ElevenLabs keys are stored securely in the database. Other keys are temporarily stored locally until the admin settings API is implemented.');
      setSaving(false);
    } catch (error) {
      logger.error('Error saving API keys:', error);
      alert('Failed to save API keys. Please try again.');
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