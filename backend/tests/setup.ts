import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

/**
 * Test setup configuration for backend tests
 * Follows CLAUDE.md testing requirements
 */

// Use test database
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://user:pass@localhost:5432/audiotricks_test';
process.env.NODE_ENV = 'test';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

/**
 * Setup test database before tests
 */
export async function setupTestDatabase() {
  try {
    // Reset and migrate test database
    execSync('npx prisma migrate deploy', { 
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }
}

/**
 * Clean up test database after tests
 */
export async function teardownTestDatabase() {
  try {
    // Clean up all tables
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Workspace", "WorkspaceUser", "ApiKey", "AudioUpload", "ProcessingJob" CASCADE`;
    await prisma.$disconnect();
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    throw error;
  }
}

/**
 * Global test setup hook
 */
beforeAll(async () => {
  await setupTestDatabase();
});

/**
 * Global test teardown hook  
 */
afterAll(async () => {
  await teardownTestDatabase();
});

/**
 * Clean up between tests
 */
afterEach(async () => {
  // Clean up test data between tests
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter(name => name !== '_prisma_migrations')
    .map(name => `"public"."${name}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.log('Note: Some tables may not exist yet');
  }
});