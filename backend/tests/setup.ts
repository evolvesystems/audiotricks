import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { beforeAll, afterAll, afterEach } from 'vitest';

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
 * Setup test database before tests - simplified for unit tests
 */
export async function setupTestDatabase() {
  // Skip database setup for unit tests that use mocks
  console.log('✅ Unit test setup complete (no database required)');
}

/**
 * Clean up test database after tests - simplified for unit tests
 */
export async function teardownTestDatabase() {
  // Skip database cleanup for unit tests that use mocks  
  console.log('✅ Unit test cleanup complete (no database required)');
}