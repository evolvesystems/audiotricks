import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const requireWorkspaceAccess = (requiredRole?: 'member' | 'admin' | 'owner') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.id || req.params.workspaceId;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Superadmins bypass all checks
      if (userRole === 'superadmin') {
        next();
        return;
      }

      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID required' });
        return;
      }

      const workspaceUser = await prisma.workspaceUser.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId
          }
        }
      });

      if (!workspaceUser) {
        res.status(403).json({ error: 'Access denied to this workspace' });
        return;
      }

      // Check role hierarchy if required
      if (requiredRole) {
        const roleHierarchy = { member: 0, admin: 1, owner: 2 };
        const userRoleLevel = roleHierarchy[workspaceUser.role as keyof typeof roleHierarchy];
        const requiredRoleLevel = roleHierarchy[requiredRole];

        if (userRoleLevel < requiredRoleLevel) {
          res.status(403).json({ error: `Requires ${requiredRole} role or higher` });
          return;
        }
      }

      // Attach workspace role to request
      req.workspaceRole = workspaceUser.role;
      next();
    } catch (error) {
      console.error('Workspace access check error:', error);
      res.status(500).json({ error: 'Failed to check workspace access' });
    }
  };
};