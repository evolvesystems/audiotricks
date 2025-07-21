import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import ActionButton from '../Dashboard/ActionButton';
import { AdminProfile } from './types';

interface ProfileSectionProps {
  profile: AdminProfile;
  editingProfile: boolean;
  onChange: (updates: Partial<AdminProfile>) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}

export default function ProfileSection({
  profile,
  editingProfile,
  onChange,
  onSave,
  onCancel,
  onEdit
}: ProfileSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Profile Information
        </h3>
        {!editingProfile && (
          <ActionButton
            onClick={onEdit}
            variant="secondary"
            className="text-sm"
          >
            Edit Profile
          </ActionButton>
        )}
      </div>

      {editingProfile ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name</label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => onChange({ firstName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name</label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => onChange({ lastName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => onChange({ email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              value={profile.department}
              onChange={(e) => onChange({ department: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <ActionButton
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </ActionButton>
            <ActionButton
              onClick={onSave}
              variant="primary"
            >
              Save Changes
            </ActionButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{profile.firstName} {profile.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{profile.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{profile.department || 'Not set'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium">{profile.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}