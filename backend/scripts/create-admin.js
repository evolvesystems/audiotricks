#!/usr/bin/env node

/**
 * Create Admin User Script
 * Creates an admin user for testing and development
 */

import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@audiotricks.com' },
          { username: 'admin' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('admin123', 12);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@audiotricks.com',
        username: 'admin',
        passwordHash,
        role: 'admin',
        isActive: true,
        emailVerified: true,
        settings: {
          create: {}
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📝 Login details:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();