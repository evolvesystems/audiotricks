import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Test fixtures for User models
 * Provides consistent test data per CLAUDE.md requirements
 */

export interface TestUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
}

export const createTestUser = async (prisma: PrismaClient, overrides: Partial<TestUser> = {}): Promise<TestUser> => {
  const defaultUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'password123',
    isActive: true,
    ...overrides
  };

  const passwordHash = await bcrypt.hash(defaultUser.password, 10);

  const user = await prisma.user.create({
    data: {
      email: defaultUser.email,
      name: defaultUser.name,
      passwordHash,
      isActive: defaultUser.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    isActive: user.isActive
  };
};

export const createTestUsers = async (prisma: PrismaClient, count: number = 3): Promise<TestUser[]> => {
  const users: TestUser[] = [];
  
  for (let i = 0; i < count; i++) {
    const user = await createTestUser(prisma, {
      email: `user${i + 1}@example.com`,
      name: `Test User ${i + 1}`
    });
    users.push(user);
  }
  
  return users;
};

export const testUserCredentials = {
  validUser: {
    email: 'test@example.com',
    password: 'password123'
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword'
  }
};