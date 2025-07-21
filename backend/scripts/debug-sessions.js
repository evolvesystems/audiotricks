import { PrismaClient } from '@prisma/client';
import { hashToken } from '../src/utils/encryption.js';

const prisma = new PrismaClient();

async function debugSessions() {
  try {
    console.log('=== ACTIVE SESSIONS ===');
    
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
      }
    });
    
    if (sessions.length === 0) {
      console.log('No sessions found.');
    } else {
      const now = new Date();
      sessions.forEach((session, index) => {
        const isExpired = session.expiresAt < now;
        console.log(`\n${index + 1}. Session ID: ${session.id}`);
        console.log(`   User: ${session.user.email} (${session.user.role})`);
        console.log(`   Created: ${session.createdAt}`);
        console.log(`   Expires: ${session.expiresAt}`);
        console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
        console.log(`   Token Hash: ${session.tokenHash.substring(0, 20)}...`);
      });
    }
    
    // Test with a fresh login token
    console.log('\n=== TESTING FRESH LOGIN ===');
    
    const testLogin = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@audiotricks.com',
        password: 'Admin123!'
      })
    });
    
    if (testLogin.ok) {
      const data = await testLogin.json();
      console.log('✅ Login successful');
      console.log(`Token (first 20 chars): ${data.token.substring(0, 20)}...`);
      
      const hash = hashToken(data.token);
      console.log(`Token hash (first 20 chars): ${hash.substring(0, 20)}...`);
      
      // Test immediate API call
      const testApi = await fetch('http://localhost:3000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${data.token}` }
      });
      
      console.log(`Immediate API test: ${testApi.ok ? '✅ SUCCESS' : '❌ FAILED'}`);
      if (!testApi.ok) {
        const errorText = await testApi.text();
        console.log(`Error: ${errorText}`);
      }
    } else {
      console.log('❌ Login failed');
      const errorText = await testLogin.text();
      console.log(`Error: ${errorText}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSessions();