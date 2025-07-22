/**
 * Project controller - Handles project-related operations
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, tags, settings } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Get user's default workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: { userId },
      include: { workspace: true }
    });

    if (!userWorkspace) {
      return res.status(400).json({ error: 'No workspace found for user' });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description || '',
        workspaceId: userWorkspace.workspaceId,
        createdById: userId,
        settings: settings || {},
        tags: tags || []
      }
    });

    res.json(project);
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get all workspaces the user has access to
    const userWorkspaces = await prisma.workspaceUser.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            projects: {
              include: {
                _count: {
                  select: { jobs: true }
                },
                createdBy: {
                  select: { id: true, name: true, email: true }
                }
              }
            }
          }
        }
      }
    });

    // Flatten all projects from all workspaces
    const projects = userWorkspaces.flatMap(uw => uw.workspace.projects);

    res.json({ projects });
  } catch (error) {
    logger.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          users: {
            some: { userId }
          }
        }
      },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { jobs: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    logger.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, description, tags, settings } = req.body;

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          users: {
            some: { userId }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name?.trim() || project.name,
        description: description !== undefined ? description : project.description,
        tags: tags !== undefined ? tags : project.tags,
        settings: settings !== undefined ? settings : project.settings
      }
    });

    res.json(updatedProject);
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const projectId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if user has access to this project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspace: {
          users: {
            some: { userId, role: { in: ['owner', 'admin'] } }
          }
        }
      },
      include: {
        _count: {
          select: { jobs: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found or insufficient permissions' });
    }

    if (project._count.jobs > 0) {
      return res.status(400).json({ error: 'Cannot delete project with existing jobs' });
    }

    await prisma.project.delete({
      where: { id: projectId }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};