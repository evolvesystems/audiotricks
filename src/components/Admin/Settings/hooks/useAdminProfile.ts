/**
 * Admin Profile Management Hook
 */

import { useState, useEffect } from 'react';
import { AdminProfile } from '../types';
import { useAdminAuthContext } from '../../../../contexts/AdminAuthContext';
import AdminSettingsService from '../../../../services/adminSettings.service';
import { createDebugLogger } from '../../../../utils/debug-logger';

const debug = createDebugLogger('admin-profile');

export function useAdminProfile() {
  const { user, token } = useAdminAuthContext();
  const [profile, setProfile] = useState<AdminProfile>({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    department: '',
    role: user?.role || 'admin'
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const profileData = await AdminSettingsService.getProfile(token);
      setProfile({
        ...profile,
        ...profileData
      });
      debug.log('Profile loaded', profileData);
    } catch (error) {
      debug.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AdminProfile>) => {
    if (!token) return;

    try {
      setSaving(true);
      const updatedProfile = { ...profile, ...updates };
      await AdminSettingsService.updateProfile(token, updatedProfile);
      setProfile(updatedProfile);
      setEditingProfile(false);
      debug.log('Profile updated', updates);
    } catch (error) {
      debug.error('Failed to update profile', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    setProfile,
    editingProfile,
    setEditingProfile,
    loading,
    saving,
    updateProfile,
    loadProfile
  };
}