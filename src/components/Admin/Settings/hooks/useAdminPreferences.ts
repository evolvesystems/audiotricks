/**
 * Admin Preferences Management Hook
 */

import { useState, useEffect } from 'react';
import { AdminPreferences } from '../types';
import { useAdminAuthContext } from '../../../../contexts/AdminAuthContext';
import AdminSettingsService from '../../../../services/adminSettings.service';
import { createDebugLogger } from '../../../../utils/debug-logger';

const debug = createDebugLogger('admin-preferences');

export function useAdminPreferences() {
  const { token } = useAdminAuthContext();
  const [preferences, setPreferences] = useState<AdminPreferences>({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true,
    maintenanceUpdates: true,
    theme: 'light',
    timezone: 'Australia/Sydney',
    dateFormat: 'EU',
    language: 'en',
    autoSave: true,
    compactMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [token]);

  const loadPreferences = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const prefsData = await AdminSettingsService.getPreferences(token);
      setPreferences({
        ...preferences,
        ...prefsData
      });
      debug.log('Preferences loaded', prefsData);
    } catch (error) {
      debug.error('Failed to load preferences', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<AdminPreferences>) => {
    if (!token) return;

    try {
      setSaving(true);
      const updatedPrefs = { ...preferences, ...updates };
      await AdminSettingsService.updatePreferences(token, updatedPrefs);
      setPreferences(updatedPrefs);
      debug.log('Preferences updated', updates);
    } catch (error) {
      debug.error('Failed to update preferences', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const resetPreferences = async () => {
    if (!token) return;

    try {
      setSaving(true);
      await AdminSettingsService.resetPreferences(token);
      await loadPreferences(); // Reload from server
      debug.log('Preferences reset to defaults');
    } catch (error) {
      debug.error('Failed to reset preferences', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    setPreferences,
    loading,
    saving,
    updatePreferences,
    resetPreferences,
    loadPreferences
  };
}