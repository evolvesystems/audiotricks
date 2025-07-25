/**
 * PermissionsMatrix Component
 * Handles individual permission toggles for roles
 */

import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

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

interface PermissionsMatrixProps {
  role: Role;
  menuPermissions: MenuPermission[];
  onPermissionToggle: (roleId: string, resource: string) => void;
}

export default function PermissionsMatrix({ 
  role, 
  menuPermissions, 
  onPermissionToggle 
}: PermissionsMatrixProps) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <ShieldCheckIcon className="h-4 w-4" />
          Access Permissions ({role.permissions.length}/{menuPermissions.length})
        </h4>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(role.permissions.length / menuPermissions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="space-y-3">
        {menuPermissions.map(menuItem => {
          const hasPermission = role.permissions.some(p => p.resource === menuItem.resource);
          const isDisabled = role.isSystemRole && role.name === 'admin';
          
          return (
            <div
              key={menuItem.resource}
              className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all duration-200 ${
                hasPermission 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              } ${isDisabled ? 'opacity-75' : 'hover:border-blue-300'}`}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  hasPermission ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <div className={`h-3 w-3 rounded-full ${
                    hasPermission ? 'bg-green-600' : 'bg-gray-400'
                  }`} />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">{menuItem.displayName}</span>
                  <div className="text-xs text-gray-500">
                    Routes: {menuItem.routes.join(', ')}
                  </div>
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasPermission}
                  onChange={() => onPermissionToggle(role.id, menuItem.resource)}
                  disabled={isDisabled}
                  className="sr-only peer"
                />
                <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                  hasPermission ? 'bg-green-600' : 'bg-gray-300'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} 
                peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300`}>
                  <div className={`absolute top-[2px] left-[2px] bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ${
                    hasPermission ? 'translate-x-full border-white' : ''
                  }`} />
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}