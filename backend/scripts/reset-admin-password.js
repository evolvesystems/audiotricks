import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const newPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    // Update admin user password
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@audiotricks.com' },
      data: { passwordHash },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });
    
    console.log('Admin password reset successfully:', updatedUser);
    console.log('Login credentials:');
    console.log('Email: admin@audiotricks.com');
    console.log('Username: admin');
    console.log('Password: Admin123!');
    
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();