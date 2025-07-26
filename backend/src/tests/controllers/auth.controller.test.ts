/**
 * Auth Controller Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import * as authController from '../../controllers/auth.controller';
import { prisma } from '../../config/database';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../config/database', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn()
    },
    session: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn()
    }
  }
}));

vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: vi.Mock;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: undefined,
      userId: undefined
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123'
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      vi.mocked(prisma.user.create).mockResolvedValue(newUser);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Registration successful',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser'
        })
      });
    });

    it('should handle duplicate email error', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'Password123'
      };

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'existing@example.com'
      } as any);

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Email already registered'
      });
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = {
        email: 'test@example.com',
        password: 'Password123'
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(user);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('test-token' as never);
      vi.mocked(prisma.session.create).mockResolvedValue({} as any);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'hashed');
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 'user-123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login successful',
        token: 'test-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com'
        })
      });
    });

    it('should reject invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'WrongPassword'
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid credentials'
      });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockRequest.userId = 'user-123';

      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 1 });

      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.session.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' }
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout successful'
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.userId = 'user-123';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        select: expect.objectContaining({
          passwordHash: false
        })
      });
      expect(mockResponse.json).toHaveBeenCalledWith(user);
    });

    it('should handle user not found', async () => {
      mockRequest.userId = 'non-existent';

      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await authController.getCurrentUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not found'
      });
    });
  });
});