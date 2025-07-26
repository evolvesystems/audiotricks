/**
 * Database Operation Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../../config/database';
import * as bcrypt from 'bcrypt';

describe('Database Operations', () => {
  describe('User Operations', () => {
    it('should create a new user', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'dbtest@example.com',
          username: 'dbtestuser',
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('dbtest@example.com');
      expect(user.username).toBe('dbtestuser');
      expect(user.role).toBe('user');
      expect(user.isActive).toBe(true);
    });

    it('should enforce unique email constraint', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      // Create first user
      await prisma.user.create({
        data: {
          email: 'unique@example.com',
          username: 'user1',
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });

      // Try to create second user with same email
      await expect(
        prisma.user.create({
          data: {
            email: 'unique@example.com',
            username: 'user2',
            passwordHash: hashedPassword,
            role: 'user',
            isActive: true
          }
        })
      ).rejects.toThrow();
    });

    it('should update user data', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'update@example.com',
          username: 'updateuser',
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'admin' }
      });

      expect(updated.role).toBe('admin');
    });

    it('should delete user and cascade sessions', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      const user = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          username: 'deleteuser',
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });

      // Create a session for the user
      await prisma.session.create({
        data: {
          userId: user.id,
          token: 'test-token',
          expiresAt: new Date(Date.now() + 86400000)
        }
      });

      // Delete user
      await prisma.user.delete({
        where: { id: user.id }
      });

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      expect(deletedUser).toBeNull();

      // Verify session is cascaded
      const sessions = await prisma.session.findMany({
        where: { userId: user.id }
      });
      expect(sessions).toHaveLength(0);
    });
  });

  describe('Session Operations', () => {
    let testUser: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      testUser = await prisma.user.create({
        data: {
          email: `session-test-${Date.now()}@example.com`,
          username: `sessionuser${Date.now()}`,
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });
    });

    it('should create a session', async () => {
      const session = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'session-token',
          expiresAt: new Date(Date.now() + 86400000)
        }
      });

      expect(session).toBeDefined();
      expect(session.userId).toBe(testUser.id);
      expect(session.token).toBe('session-token');
    });

    it('should find session with user', async () => {
      const session = await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'find-token',
          expiresAt: new Date(Date.now() + 86400000)
        }
      });

      const found = await prisma.session.findUnique({
        where: { token: 'find-token' },
        include: { user: true }
      });

      expect(found).toBeDefined();
      expect(found?.user.id).toBe(testUser.id);
      expect(found?.user.email).toBe(testUser.email);
    });

    it('should delete expired sessions', async () => {
      // Create expired session
      await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'expired-token',
          expiresAt: new Date(Date.now() - 1000) // Expired
        }
      });

      // Create valid session
      await prisma.session.create({
        data: {
          userId: testUser.id,
          token: 'valid-token',
          expiresAt: new Date(Date.now() + 86400000)
        }
      });

      // Delete expired sessions
      const deleted = await prisma.session.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      expect(deleted.count).toBe(1);

      // Verify only valid session remains
      const remaining = await prisma.session.findMany({
        where: { userId: testUser.id }
      });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].token).toBe('valid-token');
    });
  });

  describe('UserSettings Operations', () => {
    let testUser: any;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      testUser = await prisma.user.create({
        data: {
          email: `settings-test-${Date.now()}@example.com`,
          username: `settingsuser${Date.now()}`,
          passwordHash: hashedPassword,
          role: 'user',
          isActive: true
        }
      });
    });

    it('should create user settings', async () => {
      const settings = await prisma.userSettings.create({
        data: {
          userId: testUser.id,
          openaiApiKeyEncrypted: 'encrypted-key',
          elevenLabsApiKeyEncrypted: 'encrypted-key-2',
          preferences: {
            theme: 'dark',
            language: 'en'
          }
        }
      });

      expect(settings).toBeDefined();
      expect(settings.userId).toBe(testUser.id);
      expect(settings.preferences).toEqual({
        theme: 'dark',
        language: 'en'
      });
    });

    it('should update user settings', async () => {
      const settings = await prisma.userSettings.create({
        data: {
          userId: testUser.id,
          preferences: {
            theme: 'light'
          }
        }
      });

      const updated = await prisma.userSettings.update({
        where: { id: settings.id },
        data: {
          preferences: {
            theme: 'dark',
            language: 'es'
          }
        }
      });

      expect(updated.preferences).toEqual({
        theme: 'dark',
        language: 'es'
      });
    });
  });

  describe('Transaction Operations', () => {
    it('should rollback transaction on error', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      try {
        await prisma.$transaction(async (tx) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email: 'transaction@example.com',
              username: 'transactionuser',
              passwordHash: hashedPassword,
              role: 'user',
              isActive: true
            }
          });

          // Create session
          await tx.session.create({
            data: {
              userId: user.id,
              token: 'transaction-token',
              expiresAt: new Date(Date.now() + 86400000)
            }
          });

          // Force an error
          throw new Error('Transaction test error');
        });
      } catch (error) {
        // Expected error
      }

      // Verify nothing was created
      const user = await prisma.user.findUnique({
        where: { email: 'transaction@example.com' }
      });
      expect(user).toBeNull();
    });

    it('should commit successful transaction', async () => {
      const hashedPassword = await bcrypt.hash('TestPass123', 10);
      
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'success-transaction@example.com',
            username: 'successtransaction',
            passwordHash: hashedPassword,
            role: 'user',
            isActive: true
          }
        });

        const session = await tx.session.create({
          data: {
            userId: user.id,
            token: 'success-token',
            expiresAt: new Date(Date.now() + 86400000)
          }
        });

        return { user, session };
      });

      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();

      // Verify data was persisted
      const user = await prisma.user.findUnique({
        where: { id: result.user.id }
      });
      expect(user).toBeDefined();
    });
  });
});