/**
 * Roles and Permissions Service
 * Database-driven role-based access control system
 */

import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface UserPermissions {
  roles: string[];
  permissions: string[];
  canAccess: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  hasPermission: (permissionName: string) => boolean;
}

export class RolesService {
  /**
   * Get user permissions and roles
   */
  async getUserPermissions(userId: string): Promise<UserPermissions> {
    try {
      const userRoles = await prisma.userRole.findMany({
        where: {
          userId,
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      });

      const roles = userRoles.map(ur => ur.role.name);
      const permissions = userRoles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.name)
      );

      return {
        roles,
        permissions: [...new Set(permissions)], // Remove duplicates
        canAccess: (resource: string, action: string) => {
          return permissions.some(p => 
            p === `${resource}.${action}` || 
            p === `${resource}.manage` ||
            p === 'system.maintenance' // Super admin override
          );
        },
        hasRole: (roleName: string) => roles.includes(roleName),
        hasPermission: (permissionName: string) => permissions.includes(permissionName)
      };
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      return {
        roles: [],
        permissions: [],
        canAccess: () => false,
        hasRole: () => false,
        hasPermission: () => false
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.canAccess(resource, action);
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleName: string, assignedBy?: string): Promise<boolean> {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        logger.error(`Role not found: ${roleName}`);
        return false;
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId: role.id
          }
        },
        update: {
          isActive: true,
          assignedBy,
          assignedAt: new Date()
        },
        create: {
          userId,
          roleId: role.id,
          assignedBy,
          isActive: true
        }
      });

      logger.info(`Assigned role ${roleName} to user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const role = await prisma.role.findUnique({
        where: { name: roleName }
      });

      if (!role) {
        return false;
      }

      await prisma.userRole.updateMany({
        where: {
          userId,
          roleId: role.id
        },
        data: {
          isActive: false
        }
      });

      logger.info(`Removed role ${roleName} from user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    return await prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return await prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' }
      ]
    });
  }

  /**
   * Create new role
   */
  async createRole(data: {
    name: string;
    displayName: string;
    description?: string;
    permissions?: string[];
  }) {
    try {
      const role = await prisma.role.create({
        data: {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          isSystemRole: false
        }
      });

      // Assign permissions if provided
      if (data.permissions && data.permissions.length > 0) {
        const permissions = await prisma.permission.findMany({
          where: {
            name: { in: data.permissions }
          }
        });

        await prisma.rolePermission.createMany({
          data: permissions.map(permission => ({
            roleId: role.id,
            permissionId: permission.id
          }))
        });
      }

      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Setup default permissions for system roles
   */
  async setupDefaultPermissions() {
    try {
      // Create basic permissions
      const permissions = [
        // User management
        { name: 'users.read', displayName: 'View Users', resource: 'users', action: 'read' },
        { name: 'users.write', displayName: 'Edit Users', resource: 'users', action: 'write' },
        { name: 'users.delete', displayName: 'Delete Users', resource: 'users', action: 'delete' },
        { name: 'users.manage', displayName: 'Manage Users', resource: 'users', action: 'manage' },
        
        // Project management
        { name: 'projects.read', displayName: 'View Projects', resource: 'projects', action: 'read' },
        { name: 'projects.write', displayName: 'Edit Projects', resource: 'projects', action: 'write' },
        { name: 'projects.delete', displayName: 'Delete Projects', resource: 'projects', action: 'delete' },
        
        // Audio processing
        { name: 'audio.upload', displayName: 'Upload Audio', resource: 'audio', action: 'upload' },
        { name: 'audio.process', displayName: 'Process Audio', resource: 'audio', action: 'process' },
        { name: 'audio.download', displayName: 'Download Audio', resource: 'audio', action: 'download' },
        
        // Admin panel
        { name: 'admin.access', displayName: 'Admin Panel Access', resource: 'admin', action: 'access' },
        { name: 'admin.dashboard', displayName: 'Admin Dashboard', resource: 'admin', action: 'dashboard' },
        
        // Settings
        { name: 'settings.read', displayName: 'View Settings', resource: 'settings', action: 'read' },
        { name: 'settings.write', displayName: 'Edit Settings', resource: 'settings', action: 'write' },
        
        // System
        { name: 'system.maintenance', displayName: 'System Maintenance', resource: 'system', action: 'maintenance' }
      ];

      for (const permission of permissions) {
        await prisma.permission.upsert({
          where: { name: permission.name },
          update: {},
          create: {
            ...permission,
            isSystemPermission: true
          }
        });
      }

      logger.info('Default permissions setup completed');
    } catch (error) {
      logger.error('Error setting up default permissions:', error);
      throw error;
    }
  }

  /**
   * Get user's effective permissions (legacy role + new role system)
   */
  async getEffectivePermissions(userId: string): Promise<UserPermissions> {
    try {
      // Get user's legacy role from users table
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      // Get new role-based permissions
      const newPermissions = await this.getUserPermissions(userId);

      // If user has no new roles but has legacy role, assign corresponding new role
      if (newPermissions.roles.length === 0 && user?.role) {
        await this.assignRole(userId, user.role);
        return this.getUserPermissions(userId);
      }

      return newPermissions;
    } catch (error) {
      logger.error('Error getting effective permissions:', error);
      return {
        roles: [],
        permissions: [],
        canAccess: () => false,
        hasRole: () => false,
        hasPermission: () => false
      };
    }
  }
}

export const rolesService = new RolesService();