/**
 * Roles Editor Component
 * Manage roles and their associated menu permissions
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';

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

// Define available menu items with their permissions
const MENU_PERMISSIONS: MenuPermission[] = [
  { resource: 'dashboard', displayName: 'User Dashboard', routes: ['/dashboard'] },
  { resource: 'projects', displayName: 'Projects', routes: ['/projects'] },
  { resource: 'jobs', displayName: 'Jobs', routes: ['/jobs'] },
  { resource: 'upload', displayName: 'Upload', routes: ['/upload'] },
  { resource: 'admin_dashboard', displayName: 'Admin Dashboard', routes: ['/admin/users'] },
  { resource: 'users', displayName: 'User Management', routes: ['/admin/users'] },
  { resource: 'workspaces', displayName: 'Workspaces', routes: ['/admin/workspaces'] },
  { resource: 'subscriptions', displayName: 'Subscriptions', routes: ['/admin/subscriptions'] },
  { resource: 'payments', displayName: 'Payments', routes: ['/admin/payments'] },
  { resource: 'analytics', displayName: 'Analytics', routes: ['/admin/analytics'] },
  { resource: 'settings', displayName: 'Settings', routes: ['/admin/settings'] },
  { resource: 'advanced_settings', displayName: 'Advanced Settings', routes: ['/admin/super-settings'] },
];

export default function RolesEditor() {
  const { token } = useAdminAuthContext();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/admin/roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
        // Create default roles if none exist
        if (!data.roles || data.roles.length === 0) {
          await createDefaultRoles();
        }
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultRoles = async () => {
    try {
      // Create default user role
      await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'user',
          displayName: 'User',
          description: 'Standard user with access to transcription features',
          permissions: ['dashboard', 'projects', 'jobs', 'upload']
        })
      });

      // Create default admin role  
      await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'admin',
          displayName: 'Administrator',
          description: 'Full administrative access',
          permissions: MENU_PERMISSIONS.map(p => p.resource)
        })
      });

      await fetchRoles();
    } catch (error) {
      console.error('Error creating default roles:', error);
    }
  };

  const handlePermissionToggle = (roleId: string, resource: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.some(p => p.resource === resource);
        if (hasPermission) {
          return {
            ...role,
            permissions: role.permissions.filter(p => p.resource !== resource)
          };
        } else {
          return {
            ...role,
            permissions: [...role.permissions, {
              id: `temp-${Date.now()}`,
              name: `${resource}_read`,
              displayName: resource,
              resource,
              action: 'read'
            }]
          };
        }
      }
      return role;
    }));
  };

  const handleSaveRole = async (roleId: string) => {
    setSaving(true);
    try {
      const role = roles.find(r => r.id === roleId);
      if (!role) return;

      await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          permissions: role.permissions.map(p => p.resource)
        })
      });

      await fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            Roles & Permissions Editor
          </h1>
          <p className="text-gray-600 mt-2">Manage role-based menu access and permissions</p>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">System Roles</h2>
        </div>

        <div className="p-6">
          {roles.map(role => (
            <div key={role.id} className="mb-8 last:mb-0">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium">{role.displayName}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                <button
                  onClick={() => handleSaveRole(role.id)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Menu Permissions</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {MENU_PERMISSIONS.map(menuItem => {
                    const hasPermission = role.permissions.some(p => p.resource === menuItem.resource);
                    return (
                      <label
                        key={menuItem.resource}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={hasPermission}
                          onChange={() => handlePermissionToggle(role.id, menuItem.resource)}
                          disabled={role.isSystemRole && role.name === 'admin'} // Prevent removing permissions from admin
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{menuItem.displayName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Note</h3>
            <p className="mt-1 text-sm text-yellow-700">
              Changes to role permissions will take effect when users log in again. 
              The admin role always has full access and cannot be restricted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}