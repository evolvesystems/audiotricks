import { authSettings, JWTManager } from '../../src/core/auth';
import { prisma } from '../../src/config/database';
import crypto from 'crypto';

export class AuthTestUtils {
  /**
   * Get test API key from environment
   */
  static getTestApiKey(): string {
    const apiKeys = authSettings.apiKeys;
    if (apiKeys.length === 0) {
      throw new Error('No API keys configured. Run generate-api-key script first.');
    }
    return apiKeys[0]; // Use first key for testing
  }

  /**
   * Get headers for test requests with API key
   */
  static getTestHeaders(options?: {
    includeUser?: boolean;
    role?: string;
    userId?: string;
    email?: string;
  }): Record<string, string> {
    const headers: Record<string, string> = {
      [authSettings.apiKeyHeaderName]: AuthTestUtils.getTestApiKey(),
      'Content-Type': 'application/json'
    };

    if (options?.includeUser) {
      const token = JWTManager.createAccessToken({
        userId: options.userId || 'test-user-123',
        email: options.email || 'test@example.com',
        role: options.role || 'user'
      });
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Create a test user in the database
   */
  static async createTestUser(data?: {
    email?: string;
    username?: string;
    password?: string;
    role?: string;
  }) {
    const email = data?.email || `test-${Date.now()}@example.com`;
    const username = data?.username || `test-user-${Date.now()}`;
    const password = data?.password || 'Test123!@#';
    const role = data?.role || 'user';

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: hash,
        passwordSalt: salt,
        role,
        isActive: true,
        isEmailVerified: true
      }
    });

    return {
      user,
      password,
      token: JWTManager.createAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role
      })
    };
  }

  /**
   * Create a test admin user
   */
  static async createTestAdmin(data?: {
    email?: string;
    username?: string;
    password?: string;
  }) {
    return AuthTestUtils.createTestUser({
      ...data,
      role: 'admin'
    });
  }

  /**
   * Clean up test users
   */
  static async cleanupTestUsers(userIds: string[]) {
    if (userIds.length === 0) return;

    // Delete related records first
    await prisma.session.deleteMany({
      where: { userId: { in: userIds } }
    });

    await prisma.workspace.deleteMany({
      where: { ownerId: { in: userIds } }
    });

    // Delete users
    await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });
  }

  /**
   * Generate invalid API key for testing
   */
  static getInvalidApiKey(): string {
    return 'atk_invalid_key_12345';
  }

  /**
   * Generate expired JWT token for testing
   */
  static getExpiredToken(userId: string = 'test-user-123'): string {
    const payload = {
      sub: userId,
      email: 'test@example.com',
      role: 'user',
      type: 'access' as const,
      iat: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
      exp: Math.floor(Date.now() / 1000) - 3600   // 1 hour ago
    };

    // Sign with the actual secret to create a valid but expired token
    return JWTManager.createAccessToken({
      userId,
      email: 'test@example.com',
      role: 'user'
    }).split('.').slice(0, 2).join('.') + '.' + Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Mock API key for unit tests (when not hitting actual endpoints)
   */
  static mockApiKeyMiddleware(req: any, res: any, next: any) {
    req.apiKey = 'mock-api-key';
    next();
  }

  /**
   * Mock user auth for unit tests
   */
  static mockUserAuthMiddleware(user: {
    id: string;
    email: string;
    role: string;
  }) {
    return (req: any, res: any, next: any) => {
      req.userId = user.id;
      req.user = {
        ...user,
        username: user.email.split('@')[0],
        isActive: true
      };
      req.apiKey = 'mock-api-key';
      next();
    };
  }
}