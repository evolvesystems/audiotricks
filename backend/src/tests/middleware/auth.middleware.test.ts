/**
 * Auth Middleware Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { auth } from '../../core/auth/index';
import { prisma } from '../../config/database';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../config/database', () => ({
  prisma: {
    session: {
      findUnique: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      userId: undefined,
      user: undefined
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('getCurrentUserRequired', () => {
    it('should authenticate valid JWT token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        isActive: true
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000000)
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        include: { user: true }
      });
      expect(mockRequest.userId).toBe('user-123');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject missing authorization header', async () => {
      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject invalid token format', async () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat token'
      };

      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid token format'
      });
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Token expired'
      });
    });

    it('should reject invalid session', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(null);

      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid session'
      });
    });

    it('should reject inactive user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        isActive: false
      };

      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 1000000),
        user: mockUser
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123' } as any);
      vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession as any);

      await auth.getCurrentUserRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Account deactivated'
      });
    });
  });

  describe('adminRequired', () => {
    it('should allow admin access', async () => {
      mockRequest.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        username: 'admin',
        role: 'admin',
        isActive: true
      };

      await auth.adminRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should allow super_admin access', async () => {
      mockRequest.user = {
        id: 'super-123',
        email: 'super@example.com',
        username: 'superadmin',
        role: 'super_admin',
        isActive: true
      };

      await auth.adminRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject regular user', async () => {
      mockRequest.user = {
        id: 'user-123',
        email: 'user@example.com',
        username: 'user',
        role: 'user',
        isActive: true
      };

      await auth.adminRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Admin access required'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if no user', async () => {
      mockRequest.user = undefined;

      await auth.adminRequired(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Admin access required'
      });
    });
  });
});