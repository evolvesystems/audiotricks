/**
 * Profile Section Component
 * User profile management and settings
 */

import React, { useState } from 'react';
import { logger } from '../../../utils/logger';
import { PencilIcon } from '@heroicons/react/24/outline';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileForm } from './ProfileForm';
import { ProfileSecurity } from './ProfileSecurity';
import { apiClient } from '../../../services/api';

interface ProfileSectionProps {
  profile: any;
  onUpdate: () => void;
}

export default function ProfileSection({ profile, onUpdate }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: profile?.username || '',
    email: profile?.email || '',
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    company: profile?.company || '',
    phone: profile?.phone || ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await apiClient.put('/user/profile', formData);
      setEditing(false);
      onUpdate();
    } catch (error) {
      logger.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: profile?.username || '',
      email: profile?.email || '',
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      company: profile?.company || '',
      phone: profile?.phone || ''
    });
    setEditing(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>

      <ProfileAvatar profile={profile} editing={editing} />

      <ProfileForm 
        formData={formData}
        editing={editing}
        onChange={setFormData}
      />

      {/* Actions */}
      {editing && (
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      <ProfileSecurity />
    </div>
  );
}