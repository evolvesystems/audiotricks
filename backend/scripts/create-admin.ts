import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@audiotricks.com',
        username: 'admin',
        firstName: 'Admin',
        lastName: 'User',
        passwordHash,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log({
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role
    });

    console.log('\n🔐 Login credentials:');
    console.log('Email: admin@audiotricks.com');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    if ((error as any).code === 'P2002') {
      console.log('⚠️ Admin user already exists');
      
      // Try to find existing user
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'admin@audiotricks.com' },
            { username: 'admin' }
          ]
        }
      });
      
      if (existingUser) {
        console.log('Found existing user:', {
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username,
          role: existingUser.role
        });
      }
    } else {
      console.error('❌ Error creating admin user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();