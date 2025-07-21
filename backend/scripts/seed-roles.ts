/**
 * Seed script for roles and permissions
 */

import { prisma } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

async function seedRoles() {
  try {
    logger.info('Starting roles and permissions seeding...');

    // Create default roles
    const userRole = await prisma.role.upsert({
      where: { name: 'user' },
      update: {},
      create: {
        name: 'user',
        displayName: 'User',
        description: 'Default user role with basic access',
        isSystemRole: true
      }
    });

    const adminRole = await prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        displayName: 'Administrator',
        description: 'Administrator role with full access',
        isSystemRole: true
      }
    });

    logger.info('Created/updated system roles');

    // Define menu permissions
    const menuPermissions = [
      { resource: 'dashboard', displayName: 'User Dashboard' },
      { resource: 'projects', displayName: 'Projects' },
      { resource: 'jobs', displayName: 'Jobs' },
      { resource: 'upload', displayName: 'Upload' },
      { resource: 'settings', displayName: 'Settings' },
      { resource: 'admin_dashboard', displayName: 'Admin Dashboard' },
      { resource: 'admin_users', displayName: 'Users Management' },
      { resource: 'admin_workspaces', displayName: 'Workspaces' },
      { resource: 'admin_subscriptions', displayName: 'Subscriptions' },
      { resource: 'admin_payments', displayName: 'Payments' },
      { resource: 'admin_analytics', displayName: 'Analytics' },
      { resource: 'admin_roles', displayName: 'Roles & Permissions' },
      { resource: 'admin_settings', displayName: 'Admin Settings' },
      { resource: 'admin_advanced_settings', displayName: 'Advanced Settings' }
    ];

    // Create permissions
    for (const perm of menuPermissions) {
      await prisma.permission.upsert({
        where: { name: `${perm.resource}_read` },
        update: {},
        create: {
          name: `${perm.resource}_read`,
          displayName: perm.displayName,
          resource: perm.resource,
          action: 'read',
          isSystemPermission: true
        }
      });
    }

    logger.info('Created/updated permissions');

    // Assign user permissions
    const userPermissions = [
      'dashboard_read',
      'projects_read',
      'jobs_read',
      'upload_read',
      'settings_read'
    ];

    for (const permName of userPermissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName }
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: userRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: userRole.id,
            permissionId: permission.id
          }
        });
      }
    }

    logger.info('Assigned user role permissions');

    // Admin gets all permissions
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      });
    }

    logger.info('Assigned admin role permissions');

    logger.info('Roles and permissions seeding completed successfully');
  } catch (error) {
    logger.error('Error seeding roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedRoles().catch((error) => {
  console.error('Failed to seed roles:', error);
  process.exit(1);
});