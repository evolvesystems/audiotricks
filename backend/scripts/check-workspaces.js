import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkWorkspaces() {
  try {
    console.log('=== ALL WORKSPACES ===');
    const workspaces = await prisma.workspace.findMany({
      include: {
        users: {
          include: {
            user: {
              select: {
                email: true,
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true,
            audioHistory: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    if (workspaces.length === 0) {
      console.log('No workspaces found.');
    } else {
      workspaces.forEach((workspace, index) => {
        console.log(`\n${index + 1}. ${workspace.name} (${workspace.slug})`);
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Description: ${workspace.description || 'No description'}`);
        console.log(`   Active: ${workspace.isActive}`);
        console.log(`   Created: ${workspace.createdAt}`);
        console.log(`   Users: ${workspace._count.users}`);
        console.log(`   Audio History: ${workspace._count.audioHistory}`);
        
        if (workspace.users.length > 0) {
          console.log('   Members:');
          workspace.users.forEach(wu => {
            console.log(`     - ${wu.user.email} (${wu.user.username}) - Role: ${wu.role}`);
          });
        } else {
          console.log('   Members: None');
        }
      });
    }
    
    console.log('\n=== USER-WORKSPACE RELATIONSHIPS ===');
    const users = await prisma.user.findMany({
      include: {
        workspaces: {
          include: {
            workspace: {
              select: {
                name: true,
                slug: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        email: 'asc'
      }
    });
    
    users.forEach(user => {
      console.log(`\n${user.email} (${user.username}) - Role: ${user.role}`);
      if (user.workspaces.length > 0) {
        user.workspaces.forEach(uw => {
          console.log(`  - ${uw.workspace.name} (${uw.role})`);
        });
      } else {
        console.log('  - No workspace memberships');
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkspaces();