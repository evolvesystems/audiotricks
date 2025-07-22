/**
 * Team controller - Handles team management operations
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get team members for the current user's workspace
 */
export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's primary workspace
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: { userId },
      include: {
        workspace: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    name: true,
                    createdAt: true,
                    lastLoginAt: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userWorkspace) {
      return res.status(404).json({ error: 'No workspace found' });
    }

    const teamMembers = userWorkspace.workspace.users.map(member => ({
      id: member.user.id,
      username: member.user.username || member.user.name || member.user.email.split('@')[0],
      email: member.user.email,
      role: member.role.toLowerCase(),
      joinedAt: member.joinedAt,
      lastActiveAt: member.user.lastLoginAt,
      status: member.user.lastLoginAt ? 'active' : 'invited'
    }));

    res.json({ members: teamMembers });
  } catch (error) {
    logger.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};

/**
 * Update team member role
 */
export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { memberId } = req.params;
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be member or admin.' });
    }

    // Check if current user has admin/owner permissions
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: { 
        userId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!currentUserWorkspace) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Update the member's role
    const updatedMember = await prisma.workspaceUser.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: currentUserWorkspace.workspaceId
        }
      },
      data: { role: role.toUpperCase() as any }
    });

    res.json({ success: true, member: updatedMember });
  } catch (error) {
    logger.error('Error updating member role:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
};

/**
 * Remove team member
 */
export const removeMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { memberId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if current user has admin/owner permissions
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: { 
        userId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!currentUserWorkspace) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if trying to remove owner
    const memberToRemove = await prisma.workspaceUser.findFirst({
      where: {
        userId: memberId,
        workspaceId: currentUserWorkspace.workspaceId
      }
    });

    if (memberToRemove?.role === 'OWNER') {
      return res.status(403).json({ error: 'Cannot remove workspace owner' });
    }

    // Remove the member
    await prisma.workspaceUser.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: currentUserWorkspace.workspaceId
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Error removing team member:', error);
    res.status(500).json({ error: 'Failed to remove team member' });
  }
};

/**
 * Invite team member
 */
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { email, role } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required' });
    }

    if (!['member', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be member or admin.' });
    }

    // Check if current user has admin/owner permissions
    const currentUserWorkspace = await prisma.workspaceUser.findFirst({
      where: { 
        userId,
        role: { in: ['OWNER', 'ADMIN'] }
      }
    });

    if (!currentUserWorkspace) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if user already exists
    let invitedUser = await prisma.user.findUnique({
      where: { email }
    });

    // If user doesn't exist, create a basic user record
    if (!invitedUser) {
      invitedUser = await prisma.user.create({
        data: {
          email,
          username: email.split('@')[0],
          name: email.split('@')[0],
          // Set a temporary password that will need to be reset
          password: 'TEMP_INVITED_USER'
        }
      });
    }

    // Check if user is already in this workspace
    const existingMember = await prisma.workspaceUser.findUnique({
      where: {
        userId_workspaceId: {
          userId: invitedUser.id,
          workspaceId: currentUserWorkspace.workspaceId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    // Add user to workspace
    await prisma.workspaceUser.create({
      data: {
        userId: invitedUser.id,
        workspaceId: currentUserWorkspace.workspaceId,
        role: role.toUpperCase() as any,
        joinedAt: new Date()
      }
    });

    // TODO: Send invitation email

    const newMember = {
      id: invitedUser.id,
      username: invitedUser.username || invitedUser.name || email.split('@')[0],
      email: invitedUser.email,
      role: role,
      joinedAt: new Date().toISOString(),
      lastActiveAt: null,
      status: 'invited'
    };

    res.json(newMember);
  } catch (error) {
    logger.error('Error inviting team member:', error);
    res.status(500).json({ error: 'Failed to invite team member' });
  }
};