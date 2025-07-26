/**
 * Refactored Admin Settings Dashboard
 * Uses custom hooks for better separation of concerns
 */

import React, { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';
import PreferencesSection from './PreferencesSection';
import NotificationSection from './NotificationSection';
import ApiKeySection from './ApiKeySection';
import TabNavigation, { TabType } from './TabNavigation';
import { useAdminProfile } from './hooks/useAdminProfile';
import { useAdminPreferences } from './hooks/useAdminPreferences';
import { useAdminSecurity } from './hooks/useAdminSecurity';
import { useAdminApiKeys } from './hooks/useAdminApiKeys';

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('preferences');
  
  // Custom hooks for different concerns
  const profileHook = useAdminProfile();
  const preferencesHook = useAdminPreferences();
  const securityHook = useAdminSecurity();
  const apiKeysHook = useAdminApiKeys();

  // Combined loading state
  const loading = profileHook.loading || preferencesHook.loading || 
                  securityHook.loading || apiKeysHook.loading;

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
            preferences={preferencesHook.preferences}
            onChange={preferencesHook.updatePreferences}
          />
          <PreferencesSection
            preferences={preferencesHook.preferences}
            onChange={(key, value) => preferencesHook.updatePreferences({ [key]: value })}
            onSave={() => preferencesHook.updatePreferences({})}
            saving={preferencesHook.saving}
          />
        </div>
      )}

      {activeTab === 'security' && (
        <SecuritySection
          security={securityHook.security}
          onChange={securityHook.updateSecuritySettings}
          onPasswordChange={securityHook.changePassword}
          onToggle2FA={securityHook.enableTwoFactor}
        />
      )}

      {activeTab === 'profile' && (
        <ProfileSection
          profile={profileHook.profile}
          editingProfile={profileHook.editingProfile}
          onChange={(updates) => profileHook.setProfile({ ...profileHook.profile, ...updates })}
          onSave={profileHook.updateProfile}
          onCancel={() => profileHook.setEditingProfile(false)}
          onEdit={() => profileHook.setEditingProfile(true)}
        />
      )}

      {activeTab === 'apikeys' && (
        <ApiKeySection
          apiKeys={apiKeysHook.apiKeys}
          onChange={(key, value) => apiKeysHook.updateApiKey(key as any, value)}
          onTest={apiKeysHook.testApiKey}
          onRotate={apiKeysHook.rotateApiKey}
          onDelete={apiKeysHook.deleteApiKey}
          saving={apiKeysHook.saving}
          testingKeys={apiKeysHook.testingKeys}
        />
      )}
    </div>
  );
}