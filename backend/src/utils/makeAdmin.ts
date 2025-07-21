import { prisma } from '../config/database.js';

/**
 * Script to make a user an admin
 * Usage: npm run make-admin <email>
 */
async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Please provide an email address');
    console.error('Usage: npm run make-admin <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    console.log('✅ User updated successfully:');
    console.log(user);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

makeAdmin();