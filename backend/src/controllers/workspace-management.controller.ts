import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

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

/**
 * Controller for workspace CRUD operations
 */
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
            userId: userId,
            role: 'owner',
            joinedAt: new Date()
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
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: workspace
    });
    return;
  } catch (error: any) {
    console.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
    return;
  }
};

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const workspaces = await prisma.workspace.findMany({
      where: {
        users: {
          some: {
            userId: userId
          }
        },
        isActive: true
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: workspaces
    });
    return;
  } catch (error: any) {
    console.error('Error getting workspaces:', error);
    res.status(500).json({ error: 'Failed to get workspaces' });
    return;
  }
};

export const getWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: id,
        users: {
          some: {
            userId: userId
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
                firstName: true,
                lastName: true
              }
            }
          }
        },
        subscriptions: {
          include: {
            plan: true
          }
        }
      }
    });

    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json({
      success: true,
      data: workspace
    });
    return;
  } catch (error: any) {
    console.error('Error getting workspace:', error);
    res.status(500).json({ error: 'Failed to get workspace' });
    return;
  }
};

export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const validation = updateWorkspaceSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    // Check if user has permission to update workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: id,
        userId: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const workspace = await prisma.workspace.update({
      where: { id },
      data: validation.data,
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: workspace
    });
    return;
  } catch (error: any) {
    console.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
    return;
  }
};

export const deleteWorkspace = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user is workspace owner
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: id,
        userId: userId,
        role: 'owner'
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Only workspace owners can delete workspaces' });
      return;
    }

    // Soft delete by marking as inactive
    await prisma.workspace.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: 'Workspace deleted successfully'
    });
    return;
  } catch (error: any) {
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Failed to delete workspace' });
    return;
  }
};