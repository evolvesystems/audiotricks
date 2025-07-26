/**
 * Admin Security Settings Management Hook
 */

import { useState, useEffect } from 'react';
import { SecuritySettings } from '../types';
import { useAdminAuthContext } from '../../../../contexts/AdminAuthContext';
import AdminSettingsService from '../../../../services/adminSettings.service';
import { createDebugLogger } from '../../../../utils/debug-logger';

const debug = createDebugLogger('admin-security');

export function useAdminSecurity() {
  const { token } = useAdminAuthContext();
  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 60,
    loginNotifications: true,
    deviceTracking: true,
    ipWhitelist: [],
    passwordLastChanged: new Date(),
    lastLoginAt: new Date(),
    lastLoginIP: '',
    activeSessionCount: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSecuritySettings();
  }, [token]);

  const loadSecuritySettings = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const securityData = await AdminSettingsService.getSecuritySettings(token);
      setSecurity({
        ...security,
        ...securityData,
        passwordLastChanged: new Date(securityData.passwordLastChanged),
        lastLoginAt: new Date(securityData.lastLoginAt)
      });
      debug.log('Security settings loaded', securityData);
    } catch (error) {
      debug.error('Failed to load security settings', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    if (!token) return;

    try {
      setSaving(true);
      const updatedSecurity = { ...security, ...updates };
      await AdminSettingsService.updateSecuritySettings(token, updatedSecurity);
      setSecurity(updatedSecurity);
      debug.log('Security settings updated', updates);
    } catch (error) {
      debug.error('Failed to update security settings', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const enableTwoFactor = async () => {
    try {
      setSaving(true);
      const qrCode = await AdminSettingsService.enableTwoFactor(token);
      debug.log('Two-factor authentication setup initiated');
      return qrCode;
    } catch (error) {
      debug.error('Failed to enable two-factor', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const disableTwoFactor = async (password: string) => {
    try {
      setSaving(true);
      await AdminSettingsService.disableTwoFactor(token, password);
      setSecurity({ ...security, twoFactorEnabled: false });
      debug.log('Two-factor authentication disabled');
    } catch (error) {
      debug.error('Failed to disable two-factor', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setSaving(true);
      await AdminSettingsService.changePassword(token, currentPassword, newPassword);
      setSecurity({ 
        ...security, 
        passwordLastChanged: new Date() 
      });
      debug.log('Password changed successfully');
    } catch (error) {
      debug.error('Failed to change password', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const revokeAllSessions = async () => {
    try {
      setSaving(true);
      await AdminSettingsService.revokeAllSessions(token);
      debug.log('All sessions revoked');
    } catch (error) {
      debug.error('Failed to revoke sessions', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    security,
    loading,
    saving,
    updateSecuritySettings,
    enableTwoFactor,
    disableTwoFactor,
    changePassword,
    revokeAllSessions,
    loadSecuritySettings
  };
}