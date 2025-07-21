import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/environment.js';
import { hashToken } from '../utils/encryption.js';
import { AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

/**
 * User registration
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      res.status(409).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        settings: {
          create: {}
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        createdAt: true
      }
    });

    logger.info(`New user registered: ${user.email}`);
    
    res.status(201).json({
      message: 'Registration successful',
      user
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * User login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Allow login with either email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { username: email } // Using email field to check username too
        ]
      }
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    const sessionId = crypto.randomUUID();
    const payload = { 
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId 
    };
    
    const token = jwt.sign(
      payload,
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.$transaction([
      prisma.session.create({
        data: {
          id: sessionId,
          userId: user.id,
          tokenHash,
          expiresAt
        }
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    ]);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * User logout
 */
export async function logout(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.sessionId) {
      await prisma.session.delete({
        where: { id: req.sessionId }
      });
    }

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        lastLoginAt: true,
        settings: {
          select: {
            preferredLanguage: true,
            summaryQuality: true,
            settingsJson: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
}