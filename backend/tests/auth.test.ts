import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { auth, JWTManager, APIKeyManager } from '../src/core/auth';
import { AuthTestUtils } from './utils/auth';
import { prisma } from '../src/config/database';

// Create test app
const app = express();
app.use(express.json());

// Test routes
app.get('/test/public', (req, res) => {
  res.json({ message: 'public endpoint' });
});

app.get('/test/api-key-only', auth.verifyApiKey, (req, res) => {
  res.json({ message: 'api key verified', apiKey: !!req.apiKey });
});

app.get('/test/optional-auth', 
  auth.verifyApiKey, 
  auth.getCurrentUserOptional,
  (req, res) => {
    res.json({ 
      message: 'optional auth',
      hasUser: !!req.user,
      userId: req.userId 
    });
  }
);

app.get('/test/required-auth',
  auth.verifyApiKey,
  auth.getCurrentUserRequired,
  (req, res) => {
    res.json({
      message: 'authenticated',
      user: req.user
    });
  }
);

app.get('/test/admin-only',
  auth.verifyApiKey,
  auth.requireAdmin,
  (req, res) => {
    res.json({
      message: 'admin access granted',
      user: req.user
    });
  }
);

describe('Authentication System', () => {
  let testUser: any;
  let testAdmin: any;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    // Create test users
    testUser = await AuthTestUtils.createTestUser({
      email: 'testuser@example.com',
      username: 'testuser'
    });
    createdUserIds.push(testUser.user.id);

    testAdmin = await AuthTestUtils.createTestAdmin({
      email: 'testadmin@example.com',
      username: 'testadmin'
    });
    createdUserIds.push(testAdmin.user.id);
  });

  afterAll(async () => {
    // Cleanup test data
    await AuthTestUtils.cleanupTestUsers(createdUserIds);
  });

  describe('API Key Authentication', () => {
    it('should reject request without API key', async () => {
      const response = await request(app)
        .get('/test/api-key-only')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'API key required');
    });

    it('should reject request with invalid API key', async () => {
      const response = await request(app)
        .get('/test/api-key-only')
        .set('X-API-Key', AuthTestUtils.getInvalidApiKey())
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });

    it('should accept request with valid API key', async () => {
      const response = await request(app)
        .get('/test/api-key-only')
        .set('X-API-Key', AuthTestUtils.getTestApiKey())
        .expect(200);

      expect(response.body).toHaveProperty('message', 'api key verified');
      expect(response.body).toHaveProperty('apiKey', true);
    });
  });

  describe('Optional User Authentication', () => {
    it('should work without user token', async () => {
      const response = await request(app)
        .get('/test/optional-auth')
        .set('X-API-Key', AuthTestUtils.getTestApiKey())
        .expect(200);

      expect(response.body).toHaveProperty('hasUser', false);
      expect(response.body.userId).toBeUndefined();
    });

    it('should work with valid user token', async () => {
      const headers = AuthTestUtils.getTestHeaders({
        includeUser: true,
        userId: testUser.user.id,
        email: testUser.user.email
      });

      const response = await request(app)
        .get('/test/optional-auth')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('hasUser', true);
      expect(response.body).toHaveProperty('userId', testUser.user.id);
    });

    it('should continue with invalid user token', async () => {
      const response = await request(app)
        .get('/test/optional-auth')
        .set('X-API-Key', AuthTestUtils.getTestApiKey())
        .set('Authorization', 'Bearer invalid-token')
        .expect(200);

      expect(response.body).toHaveProperty('hasUser', false);
    });
  });

  describe('Required User Authentication', () => {
    it('should reject request without user token', async () => {
      const response = await request(app)
        .get('/test/required-auth')
        .set('X-API-Key', AuthTestUtils.getTestApiKey())
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/test/required-auth')
        .set('X-API-Key', AuthTestUtils.getTestApiKey())
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should accept request with valid token', async () => {
      const headers = AuthTestUtils.getTestHeaders({
        includeUser: true,
        userId: testUser.user.id,
        email: testUser.user.email
      });

      const response = await request(app)
        .get('/test/required-auth')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'authenticated');
      expect(response.body.user).toHaveProperty('id', testUser.user.id);
      expect(response.body.user).toHaveProperty('email', testUser.user.email);
    });
  });

  describe('Admin Authorization', () => {
    it('should reject non-admin user', async () => {
      const headers = AuthTestUtils.getTestHeaders({
        includeUser: true,
        userId: testUser.user.id,
        email: testUser.user.email,
        role: 'user'
      });

      const response = await request(app)
        .get('/test/admin-only')
        .set(headers)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Admin access required');
    });

    it('should accept admin user', async () => {
      const headers = AuthTestUtils.getTestHeaders({
        includeUser: true,
        userId: testAdmin.user.id,
        email: testAdmin.user.email,
        role: 'admin'
      });

      const response = await request(app)
        .get('/test/admin-only')
        .set(headers)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'admin access granted');
      expect(response.body.user).toHaveProperty('role', 'admin');
    });
  });

  describe('JWT Token Management', () => {
    it('should create valid access token', () => {
      const token = JWTManager.createAccessToken({
        userId: 'test-123',
        email: 'test@example.com',
        role: 'user'
      });

      expect(token).toBeTruthy();
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should decode valid token', () => {
      const token = JWTManager.createAccessToken({
        userId: 'test-123',
        email: 'test@example.com',
        role: 'user'
      });

      const decoded = JWTManager.decodeAccessToken(token);
      expect(decoded).toBeTruthy();
      expect(decoded?.sub).toBe('test-123');
      expect(decoded?.email).toBe('test@example.com');
      expect(decoded?.role).toBe('user');
      expect(decoded?.type).toBe('access');
    });

    it('should reject invalid token', () => {
      const decoded = JWTManager.decodeAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });

  describe('API Key Manager', () => {
    it('should generate unique API keys', () => {
      const key1 = APIKeyManager.generateApiKey();
      const key2 = APIKeyManager.generateApiKey();

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^atk_[a-f0-9]{64}$/);
    });

    it('should validate API keys correctly', () => {
      const validKey = AuthTestUtils.getTestApiKey();
      const invalidKey = 'atk_invalid';

      expect(APIKeyManager.validateApiKey(validKey, [validKey])).toBe(true);
      expect(APIKeyManager.validateApiKey(invalidKey, [validKey])).toBe(false);
    });

    it('should mask API keys correctly', () => {
      const key = 'atk_1234567890abcdef';
      const masked = APIKeyManager.getKeyPrefix(key);

      expect(masked).toBe('atk_1234****');
      expect(masked).not.toContain('567890');
    });
  });
});