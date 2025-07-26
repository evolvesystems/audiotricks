/**
 * Test Setup and Configuration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { prisma } from '../config/database';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/audiotricks_test';

// Clean up database before and after tests
beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

beforeEach(async () => {
  // Clean all tables before each test
  await prisma.audioHistory.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterEach(async () => {
  // Clean up after each test
  await prisma.audioHistory.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});