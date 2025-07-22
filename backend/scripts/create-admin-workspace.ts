/**
 * Create admin workspace for fresh database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminWorkspace() {
  try {
    // Find admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@audiotricks.com' }
    });

    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    // Check if workspace already exists
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { 
        users: {
          some: { userId: adminUser.id }
        }
      }
    });

    if (existingWorkspace) {
      console.log('✅ Admin workspace already exists:', existingWorkspace.name);
      return;
    }

    // Create default workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: 'AudioTricks Admin Workspace',
        slug: 'admin-workspace',
        description: 'Default workspace for admin user',
        users: {
          create: {
            userId: adminUser.id,
            role: 'owner',
            permissions: {}
          }
        }
      },
      include: {
        users: true
      }
    });

    console.log('✅ Admin workspace created successfully:');
    console.log({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      users: workspace.users.length
    });

  } catch (error) {
    console.error('❌ Error creating admin workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminWorkspace();