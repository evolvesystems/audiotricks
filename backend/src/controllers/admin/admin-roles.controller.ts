/**
 * Admin Roles Controller
 * Manage roles and permissions
 */

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';

export class AdminRolesController {
  /**
   * Get all roles with permissions
   */
  async getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true
            }
          },
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Transform the data to flatten permissions
      const transformedRoles = roles.map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        isSystemRole: role.isSystemRole,
        userCount: role._count.users,
        permissions: role.permissions.map(rp => rp.permission)
      }));

      res.json({ roles: transformedRoles });
    } catch (error) {
      logger.error('Error fetching roles:', error);
      next(error);
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, displayName, description, permissions } = req.body;

      // Create role
      const role = await prisma.role.create({
        data: {
          name,
          displayName,
          description
        }
      });

      // Create permissions if they don't exist and link them to the role
      if (permissions && permissions.length > 0) {
        for (const permissionResource of permissions) {
          // Create or find permission
          let permission = await prisma.permission.findFirst({
            where: { 
              resource: permissionResource,
              action: 'read'
            }
          });

          if (!permission) {
            permission = await prisma.permission.create({
              data: {
                name: `${permissionResource}_read`,
                displayName: permissionResource.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                resource: permissionResource,
                action: 'read'
              }
            });
          }

          // Link permission to role
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }

      res.status(201).json({ role });
    } catch (error) {
      logger.error('Error creating role:', error);
      next(error);
    }
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      // Check if role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      // Delete existing permissions
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });

      // Add new permissions
      if (permissions && permissions.length > 0) {
        for (const permissionResource of permissions) {
          // Create or find permission
          let permission = await prisma.permission.findFirst({
            where: { 
              resource: permissionResource,
              action: 'read'
            }
          });

          if (!permission) {
            permission = await prisma.permission.create({
              data: {
                name: `${permissionResource}_read`,
                displayName: permissionResource.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
                resource: permissionResource,
                action: 'read'
              }
            });
          }

          // Link permission to role
          await prisma.rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id
            }
          });
        }
      }

      res.json({ message: 'Permissions updated successfully' });
    } catch (error) {
      logger.error('Error updating role permissions:', error);
      next(error);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { roleId } = req.params;

      // Check if role is system role
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      if (role.isSystemRole) {
        res.status(400).json({ error: 'Cannot delete system roles' });
        return;
      }

      // Delete role (cascade will handle related records)
      await prisma.role.delete({
        where: { id: roleId }
      });

      res.json({ message: 'Role deleted successfully' });
    } catch (error) {
      logger.error('Error deleting role:', error);
      next(error);
    }
  }
}