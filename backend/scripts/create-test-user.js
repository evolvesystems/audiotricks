import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const passwordHash = await bcrypt.hash('TestUser123!', 12);
    
    const testUser = await prisma.user.create({
      data: {
        email: 'testuser@audiotricks.com',
        username: 'testuser',
        passwordHash,
        role: 'user', // Regular user, not admin
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
    
    console.log('Test user created successfully:', testUser);
    console.log('Login credentials:');
    console.log('Email: testuser@audiotricks.com');
    console.log('Username: testuser');
    console.log('Password: TestUser123!');
    
    // Also create another test user
    const passwordHash2 = await bcrypt.hash('Manager123!', 12);
    
    const managerUser = await prisma.user.create({
      data: {
        email: 'manager@audiotricks.com',
        username: 'manager',
        passwordHash: passwordHash2,
        role: 'user',
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
    
    console.log('\nManager user created successfully:', managerUser);
    console.log('Login credentials:');
    console.log('Email: manager@audiotricks.com');
    console.log('Username: manager');
    console.log('Password: Manager123!');
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('Test users already exist - that\'s fine!');
    } else {
      console.error('Error creating test users:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();