#!/usr/bin/env node

/**
 * Setup Roles and Permissions Script
 * Creates permissions and assigns roles to existing users
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupRolesAndPermissions() {
  try {
    console.log('🔧 Setting up comprehensive roles and permissions system...\n');

    // Create permissions
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
      { name: 'system.maintenance', displayName: 'System Maintenance', resource: 'system', action: 'maintenance' },
      
      // Subscriptions
      { name: 'subscriptions.read', displayName: 'View Subscriptions', resource: 'subscriptions', action: 'read' },
      { name: 'subscriptions.write', displayName: 'Edit Subscriptions', resource: 'subscriptions', action: 'write' },
      { name: 'subscriptions.manage', displayName: 'Manage Subscriptions', resource: 'subscriptions', action: 'manage' },
      
      // Analytics
      { name: 'analytics.read', displayName: 'View Analytics', resource: 'analytics', action: 'read' }
    ];

    console.log('📝 Creating permissions...');
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
    console.log(`✅ Created ${permissions.length} permissions`);

    // Get roles and permissions
    const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
    const userRole = await prisma.role.findUnique({ where: { name: 'user' } });
    const superAdminRole = await prisma.role.findUnique({ where: { name: 'super_admin' } });

    // Assign permissions to roles
    console.log('\n🔗 Assigning permissions to roles...');
    
    // Super Admin gets all permissions
    if (superAdminRole) {
      const allPermissions = await prisma.permission.findMany();
      for (const permission of allPermissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        });
      }
      console.log('✅ Super Admin: All permissions assigned');
    }

    // Admin gets most permissions
    if (adminRole) {
      const adminPermissions = permissions.filter(p => 
        !p.name.includes('system.maintenance')
      );
      
      for (const permission of adminPermissions) {
        const permissionRecord = await prisma.permission.findUnique({
          where: { name: permission.name }
        });
        if (permissionRecord) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permissionRecord.id
              }
            },
            update: {},
            create: {
              roleId: adminRole.id,
              permissionId: permissionRecord.id
            }
          });
        }
      }
      console.log('✅ Admin: Most permissions assigned');
    }

    // User gets basic permissions
    if (userRole) {
      const userPermissions = [
        'projects.read', 'projects.write', 'projects.delete',
        'audio.upload', 'audio.process', 'audio.download'
      ];
      
      for (const permissionName of userPermissions) {
        const permission = await prisma.permission.findUnique({
          where: { name: permissionName }
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
      console.log('✅ User: Basic permissions assigned');
    }

    // Assign roles to existing users based on their legacy role
    console.log('\n👥 Assigning roles to existing users...');
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, role: true }
    });

    for (const user of users) {
      let targetRole = null;
      
      if (user.role === 'admin') {
        targetRole = adminRole;
      } else if (user.role === 'superadmin') {
        targetRole = superAdminRole;
      } else {
        targetRole = userRole;
      }

      if (targetRole) {
        await prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: targetRole.id
            }
          },
          update: {
            isActive: true
          },
          create: {
            userId: user.id,
            roleId: targetRole.id,
            isActive: true
          }
        });
        console.log(`✅ ${user.username} (${user.email}) -> ${targetRole.displayName}`);
      }
    }

    console.log('\n🎉 Roles and permissions system setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   • ${permissions.length} permissions created`);
    console.log(`   • ${users.length} users assigned roles`);
    console.log('   • Database-driven role system is now active');
    
  } catch (error) {
    console.error('❌ Error setting up roles and permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupRolesAndPermissions();