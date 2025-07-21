import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSessions() {
  try {
    console.log('=== RECENT SESSIONS ===');
    
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            email: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    if (sessions.length === 0) {
      console.log('No sessions found.');
    } else {
      const now = new Date();
      sessions.forEach((session, index) => {
        const isExpired = session.expiresAt < now;
        const timeLeft = session.expiresAt.getTime() - now.getTime();
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        
        console.log(`\n${index + 1}. ${session.user.email} (${session.user.role})`);
        console.log(`   Session ID: ${session.id}`);
        console.log(`   Created: ${session.createdAt}`);
        console.log(`   Expires: ${session.expiresAt}`);
        console.log(`   Status: ${isExpired ? '❌ EXPIRED' : `✅ VALID (${hoursLeft}h left)`}`);
      });
    }
    
    // Count by user
    const userCounts = await prisma.session.groupBy({
      by: ['userId'],
      _count: {
        id: true
      },
      where: {
        expiresAt: {
          gt: new Date()
        }
      }
    });
    
    console.log('\n=== ACTIVE SESSION COUNTS BY USER ===');
    for (const count of userCounts) {
      const user = await prisma.user.findUnique({
        where: { id: count.userId },
        select: { email: true }
      });
      console.log(`${user?.email}: ${count._count.id} active sessions`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();