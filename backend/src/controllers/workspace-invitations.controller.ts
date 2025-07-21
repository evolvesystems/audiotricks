import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Validation schemas
const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['member', 'admin'])
});

/**
 * Controller for workspace invitation management
 */
export const inviteToWorkspace = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user!.id;

    const validation = inviteUserSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors[0].message });
      return;
    }

    const { email, role } = validation.data;

    // Check if user has permission to invite others
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Check if user is already invited or in workspace
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        workspaceUsers: {
          where: { workspaceId }
        }
      }
    });

    if (existingUser && existingUser.workspaceUsers.length > 0) {
      res.status(400).json({ error: 'User is already in this workspace' });
      return;
    }

    // Check for existing invitation
    const existingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: workspaceId,
        email: email,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      res.status(400).json({ error: 'User has already been invited' });
      return;
    }

    // Create invitation
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await prisma.workspaceInvitation.create({
      data: {
        workspaceId: workspaceId,
        email: email,
        role: role,
        token: token,
        invitedBy: userId,
        expiresAt: expiresAt,
        status: 'pending'
      },
      include: {
        workspace: {
          select: {
            name: true,
            slug: true
          }
        },
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // TODO: Send invitation email
    // await sendInvitationEmail(email, invitation);

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully'
    });
    return;
  } catch (error: any) {
    console.error('Error inviting user to workspace:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
    return;
  }
};

export const getWorkspaceInvitations = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user!.id;

    // Check if user has permission to view invitations
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    const invitations = await prisma.workspaceInvitation.findMany({
      where: {
        workspaceId: workspaceId
      },
      include: {
        inviter: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: invitations
    });
    return;
  } catch (error: any) {
    console.error('Error getting workspace invitations:', error);
    res.status(500).json({ error: 'Failed to get invitations' });
    return;
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const userId = req.user!.id;

    // Find invitation
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        token: token,
        status: 'pending',
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        workspace: true
      }
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invalid or expired invitation' });
      return;
    }

    // Check if user email matches invitation
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.email !== invitation.email) {
      res.status(403).json({ error: 'This invitation is for a different email address' });
      return;
    }

    // Check if user is already in workspace
    const existingMembership = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: invitation.workspaceId,
        userId: userId
      }
    });

    if (existingMembership) {
      res.status(400).json({ error: 'You are already a member of this workspace' });
      return;
    }

    // Add user to workspace
    await prisma.workspaceUser.create({
      data: {
        workspaceId: invitation.workspaceId,
        userId: userId,
        role: invitation.role,
        joinedAt: new Date()
      }
    });

    // Mark invitation as accepted
    await prisma.workspaceInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        workspace: invitation.workspace,
        role: invitation.role
      },
      message: 'Invitation accepted successfully'
    });
    return;
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
    return;
  }
};

export const revokeInvitation = async (req: Request, res: Response) => {
  try {
    const { id: workspaceId, invitationId } = req.params;
    const userId = req.user!.id;

    // Check if user has permission to revoke invitations
    const userWorkspace = await prisma.workspaceUser.findFirst({
      where: {
        workspaceId: workspaceId,
        userId: userId,
        role: { in: ['owner', 'admin'] }
      }
    });

    if (!userWorkspace) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    // Check if invitation exists and belongs to this workspace
    const invitation = await prisma.workspaceInvitation.findFirst({
      where: {
        id: invitationId,
        workspaceId: workspaceId,
        status: 'pending'
      }
    });

    if (!invitation) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    // Revoke invitation
    await prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
        revokedBy: userId
      }
    });

    res.json({
      success: true,
      message: 'Invitation revoked successfully'
    });
    return;
  } catch (error: any) {
    console.error('Error revoking invitation:', error);
    res.status(500).json({ error: 'Failed to revoke invitation' });
    return;
  }
};