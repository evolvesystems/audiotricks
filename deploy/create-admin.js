#!/usr/bin/env node

/**
 * Script to create an admin user for AudioTricks
 * Usage: node create-admin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdminUser() {
  console.log('Create AudioTricks Admin User');
  console.log('============================\n');

  try {
    const email = await question('Enter admin email: ');
    const username = await question('Enter admin username: ');
    const password = await question('Enter admin password: ');
    
    // Validate inputs
    if (!email || !username || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        role: 'admin',
        isActive: true
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`Email: ${user.email}`);
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log('\nYou can now login at https://yourdomain.com/admin/login');

  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdminUser();