/**
 * Script to make a user a super admin
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    const userEmail = 'admin@audiotricks.com'; // Change this to the user you want to make super admin
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });
    
    if (!user) {
      console.log(`User with email ${userEmail} not found`);
      return;
    }
    
    console.log(`Current user role: ${user.role}`);
    
    // Update user to admin
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'admin' }
    });
    
    console.log(`✅ User ${userEmail} is now an admin`);
    console.log(`New role: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('Error making user super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();