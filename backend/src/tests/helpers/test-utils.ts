/**
 * Test Utilities and Helpers
 */

import { Express } from 'express';
import request from 'supertest';
import { User } from '@prisma/client';
import { prisma } from '../../config/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

export interface TestUser {
  user: User;
  token: string;
  password: string;
}

/**
 * Create a test user with authentication
 */
export async function createTestUser(data?: {
  email?: string;
  username?: string;
  password?: string;
  role?: string;
}): Promise<TestUser> {
  const email = data?.email || 'test@example.com';
  const username = data?.username || 'testuser';
  const password = data?.password || 'TestPass123';
  const role = data?.role || 'user';

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: hashedPassword,
      role,
      isActive: true
    }
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { user, token, password };
}

/**
 * Make authenticated request
 */
export function authenticatedRequest(app: Express, token: string) {
  return {
    get: (url: string) => request(app).get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request(app).post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request(app).put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request(app).delete(url).set('Authorization', `Bearer ${token}`)
  };
}

/**
 * Assert validation error response
 */
export function expectValidationError(response: request.Response, field: string) {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('errors');
  expect(response.body.errors).toBeInstanceOf(Array);
  
  const fieldError = response.body.errors.find((err: any) => err.path === field);
  expect(fieldError).toBeDefined();
}