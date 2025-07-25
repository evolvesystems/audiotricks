import { prisma } from './src/config/database.js';

async function checkAdminUser() {
  console.log('🔍 Checking for admin user in database...');
  
  try {
    // Check for user with admin email
    const adminUser = await prisma.user.findUnique({
      where: {
        email: 'admin@audiotricks.com'
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log(`   ID: ${adminUser.id}`);
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Name: ${adminUser.firstName} ${adminUser.lastName}`);
      console.log(`   Created: ${adminUser.createdAt}`);
      console.log(`   Email Verified: ${adminUser.emailVerified}`);
      console.log(`   Active: ${adminUser.isActive}`);
      
      if (adminUser.userRoles && adminUser.userRoles.length > 0) {
        console.log('   Roles:');
        adminUser.userRoles.forEach(userRole => {
          console.log(`     - ${userRole.role.name} (${userRole.role.description})`);
        });
      } else {
        console.log('   ⚠️  No roles assigned');
      }
      
      // Check password hash (don't log the actual hash for security)
      if (adminUser.passwordHash) {
        console.log('   ✅ Password hash exists');
      } else {
        console.log('   ❌ No password hash found');
      }
      
    } else {
      console.log('❌ Admin user not found');
      
      // Check if any users exist
      const userCount = await prisma.user.count();
      console.log(`📊 Total users in database: ${userCount}`);
      
      if (userCount > 0) {
        console.log('🔍 Existing users:');
        const users = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          },
          take: 5
        });
        
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.firstName} ${user.lastName}) - Active: ${user.isActive}`);
        });
      }
    }

    // Check available roles
    console.log('\n🛡️  Available roles in system:');
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true
      }
    });
    
    roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description}`);
    });

  } catch (error) {
    console.error('💥 Database check failed:', error.message);
    
    // Try to get more specific error info
    if (error.code === 'P2021') {
      console.log('❌ Table does not exist - database may not be migrated');
    } else if (error.code === 'P1001') {
      console.log('❌ Cannot connect to database');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();