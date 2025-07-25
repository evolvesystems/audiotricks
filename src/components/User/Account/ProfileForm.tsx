/**
 * Profile Form Component - Form fields for user profile editing
 */

import React from 'react';

interface ProfileFormData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
}

interface ProfileFormProps {
  formData: ProfileFormData;
  editing: boolean;
  onChange: (data: ProfileFormData) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ formData, editing, onChange }) => {
  const inputClass = (editing: boolean) => `w-full px-3 py-2 border rounded-lg ${
    editing 
      ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
      : 'border-gray-200 bg-gray-50 cursor-not-allowed'
  }`;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Username */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          value={formData.username}
          onChange={(e) => onChange({ ...formData, username: e.target.value })}
          disabled={!editing}
          className={inputClass(editing)}
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
          onChange={(e) => onChange({ ...formData, email: e.target.value })}
          disabled={!editing}
          className={inputClass(editing)}
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
          onChange={(e) => onChange({ ...formData, firstName: e.target.value })}
          disabled={!editing}
          className={inputClass(editing)}
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
          onChange={(e) => onChange({ ...formData, lastName: e.target.value })}
          disabled={!editing}
          className={inputClass(editing)}
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
          onChange={(e) => onChange({ ...formData, company: e.target.value })}
          disabled={!editing}
          placeholder="Optional"
          className={inputClass(editing)}
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
          onChange={(e) => onChange({ ...formData, phone: e.target.value })}
          disabled={!editing}
          placeholder="Optional"
          className={inputClass(editing)}
        />
      </div>
    </div>
  );
};