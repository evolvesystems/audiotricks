/**
 * Roles Editor Component
 * Manage roles and their associated menu permissions
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { useAdminAuthContext } from '../../../contexts/AdminAuthContext';
import RolesList from './RolesList';
import RoleForm from './RoleForm';

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
      logger.error('Error fetching roles:', error);
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
      logger.error('Error creating default roles:', error);
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
      logger.error('Error saving role:', error);
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
      <RolesList roles={roles} menuPermissions={MENU_PERMISSIONS} />

      {/* Roles Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {roles.map(role => (
          <RoleForm
            key={role.id}
            role={role}
            menuPermissions={MENU_PERMISSIONS}
            saving={saving}
            onSaveRole={handleSaveRole}
            onPermissionToggle={handlePermissionToggle}
          />
        ))}
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