import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createJohnNorthUser() {
  try {
    // Hash a simple password
    const passwordHash = await bcrypt.hash('password123', 10);

    // Create JohnNorth user
    const user = await prisma.user.create({
      data: {
        email: 'john@audiotricks.com',
        username: 'JohnNorth',
        firstName: 'John',
        lastName: 'North',
        passwordHash,
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ JohnNorth user created successfully:');
    console.log({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    console.log('\n🔐 Your login credentials:');
    console.log('Email: john@audiotricks.com');
    console.log('Username: JohnNorth');
    console.log('Password: password123');

  } catch (error) {
    if ((error as any).code === 'P2002') {
      console.log('⚠️ JohnNorth user already exists');
      
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: 'john@audiotricks.com' },
            { username: 'JohnNorth' }
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
      console.error('❌ Error creating user:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createJohnNorthUser();