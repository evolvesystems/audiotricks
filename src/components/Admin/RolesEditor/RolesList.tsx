/**
 * RolesList Component
 * Displays role overview statistics and summary
 */

import React from 'react';
import { 
  ShieldCheckIcon, 
  CheckIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole: boolean;
  permissions: Permission[];
}

interface Permission {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
}

interface MenuPermission {
  resource: string;
  displayName: string;
  routes: string[];
}

interface RolesListProps {
  roles: Role[];
  menuPermissions: MenuPermission[];
}

export default function RolesList({ roles, menuPermissions }: RolesListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            Roles & Permissions
          </h1>
          <p className="text-gray-600 mt-2">Control access to different parts of the application</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{roles.length}</h3>
              <p className="text-sm text-gray-500">Total Roles</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{menuPermissions.length}</h3>
              <p className="text-sm text-gray-500">Available Permissions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PlusIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Customizable</h3>
              <p className="text-sm text-gray-500">Role Management</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}