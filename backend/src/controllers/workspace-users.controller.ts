import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const addUserSchema = z.object({
  userId: z.string(),
  role: z.enum(['member', 'admin'])
});

const updateUserRoleSchema = z.object({
  role: z.enum(['member', 'admin'])
});

/**
 * Controller for workspace user management operations
 */
export const getWorkspaceUsers = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user!.id;

    // Check if user has access to workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const users = await prisma.workspaceUser.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // owners first, then admins, then members
        { joinedAt: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: users
    });
    return;
  } catch (error: any) {
    console.error('Error getting workspace users:', error);
    res.status(500).json({ error: 'Failed to get workspace users' });
    return;
  }
};

export const addUserToWorkspace = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const currentUserId = req.user!.id;

    const validation = addUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { userId, role } = validation.data;

    // Check if current user has permission to add users
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: currentUserId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Check if user is already in workspace
    const existingUser = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId
      }
    });

    if (existingUser) {
      res.status(400).json({ error: 'User is already in this workspace' });
      return;
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Add user to workspace
    const workspaceUser = await prisma.workspaceUser.create({
      data: {
        workspaceId: workspaceId,
        userId: userId,
        role: role,
        joinedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: workspaceUser
    });
    return;
  } catch (error: any) {
    console.error('Error adding user to workspace:', error);
    res.status(500).json({ error: 'Failed to add user to workspace' });
    return;
  }
};

export const updateWorkspaceUser = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, userId: targetUserId } = req.params;
    const currentUserId = req.user!.id;

    const validation = updateUserRoleSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { role } = validation.data;

    // Check if current user has permission to update user roles
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: currentUserId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Can't change owner role
    const targetUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: targetUserId
      }
    });

    if (!targetUserWorkspace) {
      res.status(404).json({ error: 'User not found in workspace' });
      return;
    }

    if (targetUserWorkspace.role === 'owner') {
      res.status(400).json({ error: 'Cannot change owner role' });
      return;
    }

    // Update user role
    const updatedUser = await prisma.workspaceUser.update({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: targetUserId
        }
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedUser
    });
    return;
  } catch (error: any) {
    console.error('Error updating workspace user:', error);
    res.status(500).json({ error: 'Failed to update user role' });
    return;
  }
};

export const removeFromWorkspace = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, userId: targetUserId } = req.params;
    const currentUserId = req.user!.id;

    // Check if current user has permission to remove users
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: currentUserId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Check if target user exists in workspace
    const targetUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: targetUserId
      }
    });

    if (!targetUserWorkspace) {
      res.status(404).json({ error: 'User not found in workspace' });
      return;
    }

    // Can't remove workspace owner
    if (targetUserWorkspace.role === 'owner') {
      res.status(400).json({ error: 'Cannot remove workspace owner' });
      return;
    }

    // Remove user from workspace
    await prisma.workspaceUser.delete({
      where: {
        workspaceId_userId: {
          workspaceId: workspaceId,
          userId: targetUserId
        }
      }
    });

    res.json({
      success: true,
      message: 'User removed from workspace successfully'
    });
    return;
  } catch (error: any) {
    console.error('Error removing user from workspace:', error);
    res.status(500).json({ error: 'Failed to remove user from workspace' });
    return;
  }
};

export const getAvailableUsers = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const { search } = req.query;
    const currentUserId = req.user!.id;

    // Check if current user has permission to view available users
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: currentUserId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!currentUserWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Get users not in this workspace
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            NOT: {
              workspaceUsers: {
                some: {
                  workspaceId: workspaceId
                }
              }
            }
          },
          search ? {
            OR: [
              { email: { contains: search as string, mode: 'insensitive' } },
              { name: { contains: search as string, mode: 'insensitive' } }
            ]
          } : {}
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      take: 50 // Limit results
    });

    res.json({
      success: true,
      data: users
    });
    return;
  } catch (error: any) {
    console.error('Error getting available users:', error);
    res.status(500).json({ error: 'Failed to get available users' });
    return;
  }
};