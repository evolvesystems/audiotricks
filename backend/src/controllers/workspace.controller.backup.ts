import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only')
});

const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional()
});

const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin'])
});

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const validation = createWorkspaceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { name, description, slug } = validation.data;
    const userId = req.user!.id;

    // Check if slug is already taken
    const existingWorkspace = await prisma.workspace.findUnique({
      where: { slug }
    });

    if (existingWorkspace) {
      res.status(400).json({ error: 'Workspace slug already exists' });
      return;
    }

    // Create workspace and add creator as owner
    const workspace = await prisma.workspace.create({
      data: {
        name,
        description,
        slug,
        users: {
          create: {
            userId,
            role: 'owner'
          }
        }
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true
              }
            }
          }
        }
      }
    });

    res.json({ workspace });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    let workspaces;

    if (userRole === 'superadmin' || userRole === 'admin') {
      // Superadmins and admins can see all workspaces
      workspaces = await prisma.workspace.findMany({
        include: {
          _count: {
            select: {
              users: true,
              audioHistory: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Regular users see only their workspaces
      workspaces = await prisma.workspace.findMany({
        where: {
          users: {
            some: {
              userId
            }
          }
        },
        include: {
          users: {
            where: { userId },
            select: { role: true }
          },
          _count: {
            select: {
              users: true,
              audioHistory: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ workspaces });
  } catch (error) {
    console.error('Get workspaces error:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                lastLoginAt: true
              }
            }
          }
        },
        _count: {
          select: {
            audioHistory: true
          }
        }
      }
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    // Check if user has access to this workspace
    const userAccess = workspace.users.find(wu => wu.userId === userId);
    if (!userAccess && userRole !== 'superadmin') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ workspace });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Failed to fetch workspace' });
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = updateWorkspaceSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: validation.data
    });

    res.json({ workspace });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
};

export const inviteToWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validation = inviteUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { email, role } = validation.data;

    // Check if user already exists and is in workspace
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaces: {
          where: { workspaceId: id }
        }
      }
    });

    if (existingUser && existingUser.workspaces.length > 0) {
      res.status(400).json({ error: 'User is already in this workspace' });
      return;
    }

    // Create invitation token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: id,
        email,
        role,
        token,
        expiresAt
      },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    // TODO: Send invitation email

    res.json({ 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
        workspace: invitation.workspace
      }
    });
  } catch (error) {
    console.error('Invite to workspace error:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
};

export const getAvailableUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { search = '' } = req.query;

    // Get users who are NOT already in this workspace
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            NOT: {
              workspaces: {
                some: {
                  workspaceId: id
                }
              }
            }
          },
          // Search filter
          ...(search ? [{
            OR: [
              { email: { contains: String(search), mode: 'insensitive' as const } },
              { username: { contains: String(search), mode: 'insensitive' as const } }
            ]
          }] : [])
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        lastLoginAt: true
      },
      take: 20,
      orderBy: { username: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ error: 'Failed to fetch available users' });
  }
};

export const getWorkspaceUsers = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, search = '' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      workspaceId: id,
      ...(search && {
        user: {
          OR: [
            { email: { contains: String(search), mode: 'insensitive' as const } },
            { username: { contains: String(search), mode: 'insensitive' as const } }
          ]
        }
      })
    };

    const [users, total] = await Promise.all([
      prisma.workspaceUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              lastLoginAt: true,
              isActive: true,
              _count: {
                select: {
                  audioHistory: {
                    where: { workspaceId: id }
                  }
                }
              }
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { joinedAt: 'desc' }
      }),
      prisma.workspaceUser.count({ where })
    ]);

    res.json({
      users: users.map(wu => ({
        ...wu.user,
        workspaceRole: wu.role,
        joinedAt: wu.joinedAt
      })),
      pagination: {
        total,
        pages: Math.ceil(total / Number(limit)),
        current: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    console.error('Get workspace users error:', error);
    res.status(500).json({ error: 'Failed to fetch workspace users' });
  }
};

export const updateWorkspaceUser = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!['member', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    const workspaceUser = await prisma.workspaceUser.update({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      },
      data: { role }
    });

    res.json({ workspaceUser });
  } catch (error) {
    console.error('Update workspace user error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
};

export const addUserToWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, role = 'member' } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    if (!['member', 'admin'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, isActive: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.isActive) {
      res.status(400).json({ error: 'Cannot add inactive user to workspace' });
      return;
    }

    // Check if user is already in workspace
    const existingMembership = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    });

    if (existingMembership) {
      res.status(400).json({ error: 'User is already a member of this workspace' });
      return;
    }

    // Add user to workspace
    const workspaceUser = await prisma.workspaceUser.create({
      data: {
        workspaceId: id,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            lastLoginAt: true,
            isActive: true
          }
        }
      }
    });

    res.json({ 
      message: 'User added to workspace successfully',
      workspaceUser: {
        ...workspaceUser.user,
        workspaceRole: workspaceUser.role,
        joinedAt: workspaceUser.joinedAt
      }
    });
  } catch (error) {
    console.error('Add user to workspace error:', error);
    res.status(500).json({ error: 'Failed to add user to workspace' });
  }
};

export const removeFromWorkspace = async (req: Request, res: Response) => {
  try {
    const { id, userId } = req.params;

    // Don't allow removing the last owner
    const owners = await prisma.workspaceUser.count({
      where: {
        workspaceId: id,
        role: 'owner'
      }
    });

    const userToRemove = await prisma.workspaceUser.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    });

    if (userToRemove?.role === 'owner' && owners === 1) {
      res.status(400).json({ error: 'Cannot remove the last owner' });
      return;
    }

    await prisma.workspaceUser.delete({
      where: {
        workspaceId_userId: {
          workspaceId: id,
          userId
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Remove from workspace error:', error);
    res.status(500).json({ error: 'Failed to remove user from workspace' });
  }
};