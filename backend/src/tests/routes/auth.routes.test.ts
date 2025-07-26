/**
 * Authentication Routes Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth.routes';
import { errorHandler } from '../../middleware/errorHandler';
import { createTestUser, expectValidationError, authenticatedRequest } from '../helpers/test-utils';
import { prisma } from '../../config/database';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'NewPass123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Registration successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.user).toHaveProperty('username', 'newuser');
      expect(response.body.user).not.toHaveProperty('passwordHash');
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'newuser',
          password: 'NewPass123'
        });

      expectValidationError(response, 'email');
    });

    it('should fail with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'NewPass123'
        });

      expectValidationError(response, 'username');
    });

    it('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'weak'
        });

      expectValidationError(response, 'password');
    });

    it('should fail with duplicate email', async () => {
      await createTestUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          username: 'newuser',
          password: 'NewPass123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const { password } = await createTestUser({
        email: 'login@example.com',
        username: 'loginuser',
        password: 'LoginPass123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'login@example.com');
    });

    it('should login with username instead of email', async () => {
      const { password } = await createTestUser({
        username: 'uniqueuser',
        password: 'LoginPass123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'uniqueuser',
          password
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
      await createTestUser({
        email: 'wrongpass@example.com',
        password: 'CorrectPass123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'WrongPass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const { token, user } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', user.id);
      expect(response.body).toHaveProperty('email', user.email);
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify session is deleted
      const session = await prisma.session.findFirst({
        where: { token }
      });
      expect(session).toBeNull();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const { token, password } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .put('/api/auth/change-password')
        .send({
          currentPassword: password,
          newPassword: 'NewSecurePass123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password changed successfully');
    });

    it('should fail with wrong current password', async () => {
      const { token } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .put('/api/auth/change-password')
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewSecurePass123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Current password is incorrect');
    });

    it('should fail with weak new password', async () => {
      const { token, password } = await createTestUser();

      const response = await authenticatedRequest(app, token)
        .put('/api/auth/change-password')
        .send({
          currentPassword: password,
          newPassword: 'weak'
        });

      expectValidationError(response, 'newPassword');
    });
  });
});