/**
 * Workspace User controller - Handles user workspace operations
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get user's workspaces
 */
export const getUserWorkspaces = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            _count: {
              select: {
                users: true,
                projects: true
              }
            }
          }
        }
      },
      orderBy: {
        workspace: {
          createdAt: 'desc'
        }
      }
    });

    const workspaces = userWorkspaces.map(uw => ({
      id: uw.workspace.id,
      name: uw.workspace.name,
      description: uw.workspace.description,
      role: uw.role.toLowerCase(),
      joinedAt: uw.joinedAt,
      memberCount: uw.workspace._count.users,
      projectCount: uw.workspace._count.projects,
      createdAt: uw.workspace.createdAt,
      updatedAt: uw.workspace.updatedAt
    }));

    res.json({ workspaces });
  } catch (error) {
    logger.error('Error fetching user workspaces:', error);
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
};

/**
 * Create new workspace
 */
export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { name, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    // Create workspace
    const workspace = await prisma.workspace.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    });

    // Add user as owner
    await prisma.workspaceUser.create({
      data: {
        userId,
        workspaceId: workspace.id,
        role: 'OWNER',
        joinedAt: new Date()
      }
    });

    const newWorkspace = {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description,
      role: 'owner',
      joinedAt: new Date().toISOString(),
      memberCount: 1,
      projectCount: 0,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };

    res.status(201).json(newWorkspace);
  } catch (error) {
    logger.error('Error creating workspace:', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
};

/**
 * Update workspace
 */
export const updateWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has owner/admin permissions
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        userId,
        workspaceId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!userWorkspace) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: name?.trim(),
        description: description?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            users: true,
            projects: true
          }
        }
      }
    });

    const workspace = {
      id: updatedWorkspace.id,
      name: updatedWorkspace.name,
      description: updatedWorkspace.description,
      role: userWorkspace.role.toLowerCase(),
      joinedAt: userWorkspace.joinedAt,
      memberCount: updatedWorkspace._count.users,
      projectCount: updatedWorkspace._count.projects,
      createdAt: updatedWorkspace.createdAt,
      updatedAt: updatedWorkspace.updatedAt
    };

    res.json(workspace);
  } catch (error) {
    logger.error('Error updating workspace:', error);
    res.status(500).json({ error: 'Failed to update workspace' });
  }
};

/**
 * Leave workspace
 */
export const leaveWorkspace = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { workspaceId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user is in workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: { userId, workspaceId }
    });

    if (!userWorkspace) {
      return res.status(404).json({ error: 'Not a member of this workspace' });
    }

    // Check if user is the only owner
    if (userWorkspace.role === 'OWNER') {
      const ownerCount = await prisma.workspaceUser.count({
        where: {
          workspaceId,
          role: 'OWNER'
        }
      });

      if (ownerCount === 1) {
        return res.status(400).json({ 
          error: 'Cannot leave workspace as the only owner. Transfer ownership first or delete the workspace.' 
        });
      }
    }

    // Remove user from workspace
    await prisma.workspaceUser.delete({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error leaving workspace:', error);
    res.status(500).json({ error: 'Failed to leave workspace' });
  }
};