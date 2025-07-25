/**
 * RoleForm Component
 * Individual role card with header and save functionality
 */

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import PermissionsMatrix from './PermissionsMatrix';

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

interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystemRole: boolean;
  permissions: Permission[];
}

interface RoleFormProps {
  role: Role;
  menuPermissions: MenuPermission[];
  saving: boolean;
  onSaveRole: (roleId: string) => void;
  onPermissionToggle: (roleId: string, resource: string) => void;
}

export default function RoleForm({ 
  role, 
  menuPermissions, 
  saving, 
  onSaveRole, 
  onPermissionToggle 
}: RoleFormProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                role.name === 'admin' ? 'bg-purple-100 text-purple-800' : 
                role.name === 'user' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {role.displayName}
              </span>
              {role.isSystemRole && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  System Role
                </span>
              )}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{role.description}</p>
          </div>
          <button
            onClick={() => onSaveRole(role.id)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <CheckIcon className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <PermissionsMatrix
        role={role}
        menuPermissions={menuPermissions}
        onPermissionToggle={onPermissionToggle}
      />
    </div>
  );
}