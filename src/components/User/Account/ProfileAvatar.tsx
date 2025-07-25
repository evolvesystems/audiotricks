/**
 * Profile Avatar Component - User avatar display with edit capability
 */

import React from 'react';
import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline';

interface ProfileAvatarProps {
  profile: any;
  editing: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ profile, editing }) => {
  return (
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
  );
};