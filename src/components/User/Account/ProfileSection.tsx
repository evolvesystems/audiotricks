/**
 * Profile Section Component
 * User profile management and settings
 */

import React, { useState } from 'react';
import { logger } from '../../../utils/logger';
import { 
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon
} from '@heroicons/react/24/outline';

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
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditing(false);
        onUpdate();
      }
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

      {/* Profile Picture */}
      <div className="flex items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            {profile?.avatar ? (
              <img 
                src={profile.avatar} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <UserCircleIcon className="w-16 h-16 text-white" />
            )}
          </div>
          {editing && (
            <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50">
              <CameraIcon className="h-4 w-4 text-gray-600" />
            </button>
          )}
        </div>
        <div>
          <h4 className="text-xl font-semibold text-gray-900">
            {profile?.firstName} {profile?.lastName}
          </h4>
          <p className="text-gray-600">@{profile?.username}</p>
          <p className="text-sm text-gray-500 mt-1">
            Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            disabled={!editing}
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!editing}
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* First Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            disabled={!editing}
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Last Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            disabled={!editing}
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            disabled={!editing}
            placeholder="Optional"
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!editing}
            placeholder="Optional"
            className={`w-full px-3 py-2 border rounded-lg ${
              editing 
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
            }`}
          />
        </div>
      </div>

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

      {/* Security Section */}
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
    </div>
  );
}