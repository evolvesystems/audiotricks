import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Get all users with pagination
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          businessName: true,
          mobile: true,
          country: true,
          currency: true,
          createdAt: true,
          lastLoginAt: true,
          isActive: true,
          _count: {
            select: {
              audioHistory: true,
              sessions: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * Get single user details
 */
export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        settings: {
          select: {
            preferredLanguage: true,
            summaryQuality: true,
            updatedAt: true
          }
        },
        _count: {
          select: {
            audioHistory: true,
            sessions: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Remove sensitive data
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

/**
 * Update user role
 */
export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true
      }
    });

    logger.info(`User role updated: ${user.email} -> ${role}`);
    res.json({ message: 'User role updated', user });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { isActive: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        username: true,
        isActive: true
      }
    });

    logger.info(`User status toggled: ${updatedUser.email} -> ${updatedUser.isActive ? 'active' : 'inactive'}`);
    res.json({ 
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'}`,
      user: updatedUser
    });
  } catch (error) {
    logger.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
}

/**
 * Create new user
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password, role = 'user', businessName, mobile, country = 'US', currency = 'USD' } = req.body;

    // Check if user exists
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
        role,
        businessName,
        mobile,
        country,
        currency,
        settings: {
          create: {}
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    logger.info(`Admin created new user: ${user.email}`);
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    logger.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

/**
 * Update user details
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { email, username, password, role, isActive, businessName, mobile, country, currency } = req.body;

    // Check if email/username is taken by another user
    if (email || username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(email ? [{ email }] : []),
                ...(username ? [{ username }] : [])
              ]
            }
          ]
        }
      });

      if (existingUser) {
        res.status(409).json({ 
          error: existingUser.email === email 
            ? 'Email already taken by another user' 
            : 'Username already taken by another user' 
        });
        return;
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (username) updateData.username = username;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
    if (businessName !== undefined) updateData.businessName = businessName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (country !== undefined) updateData.country = country;
    if (currency !== undefined) updateData.currency = currency;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    logger.info(`Admin updated user: ${user.email}`);
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

/**
 * Delete user
 */
export async function deleteUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.userId === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const user = await prisma.user.delete({
      where: { id },
      select: { email: true }
    });

    logger.info(`Admin deleted user: ${user.email}`);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

/**
 * Get system statistics
 */
export async function getStats(_req: Request, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      activeUsers,
      totalAudioProcessed,
      recentActivity
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.audioHistory.count(),
      prisma.audioHistory.findMany({
        select: {
          id: true,
          title: true,
          createdAt: true,
          user: {
            select: {
              username: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        totalAudioProcessed,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = item._count;
          return acc;
        }, {} as Record<string, number>)
      },
      recentActivity
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}