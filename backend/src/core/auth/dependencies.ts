import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authSettings } from './config';
import { APIKeyManager } from './api-keys';
import { JWTManager } from './jwt';
import { logger } from '../../utils/logger';

export interface AuthRequest extends Request {
  apiKey?: string;
  userId?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    role: string;
    isActive: boolean;
  };
  sessionId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  role: string;
  apiKey: string;
}

export class AuthDependencies {
  /**
   * Verify API key - always required for API access
   */
  static async verifyApiKey(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Skip API key check if disabled (development only)
      if (!authSettings.requireApiKey) {
        req.apiKey = 'bypass';
        next();
        return;
      }

      const apiKey = req.headers[authSettings.apiKeyHeaderName.toLowerCase()] as string;

      if (!apiKey) {
        res.status(401).json({
          error: 'API key required',
          message: `Please provide API key in ${authSettings.apiKeyHeaderName} header`
        });
        return;
      }

      // Validate API key
      if (!APIKeyManager.validateApiKey(apiKey, authSettings.apiKeys)) {
        logger.warn('Invalid API key attempt', {
          keyPrefix: APIKeyManager.getKeyPrefix(apiKey),
          ip: req.ip
        });
        
        res.status(403).json({
          error: 'Invalid API key',
          message: 'The provided API key is not valid'
        });
        return;
      }

      // Store API key in request for later use
      req.apiKey = apiKey;
      
      logger.debug('API key validated', {
        keyPrefix: APIKeyManager.getKeyPrefix(apiKey)
      });

      next();
    } catch (error) {
      logger.error('API key verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get current user if JWT provided (optional)
   */
  static async getCurrentUserOptional(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // API key must already be verified
      if (!req.apiKey) {
        await AuthDependencies.verifyApiKey(req, res, () => {});
        if (!req.apiKey) return; // Response already sent
      }

      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : req.cookies?.token;

      if (!token) {
        next();
        return;
      }

      const payload = JWTManager.decodeAccessToken(token);
      
      if (!payload) {
        // Invalid token but auth is optional, so continue
        next();
        return;
      }

      // Load user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true
        }
      });

      if (!user) {
        // User not found but auth is optional
        next();
        return;
      }

      if (!user.isActive) {
        // User deactivated but auth is optional
        next();
        return;
      }

      // Attach user to request
      req.userId = user.id;
      req.user = user;
      req.sessionId = payload.sessionId;

      logger.debug('Optional auth: user authenticated', { userId: user.id });

      next();
    } catch (error) {
      logger.error('Optional auth error:', error);
      // Don't fail on optional auth errors
      next();
    }
  }

  /**
   * Get current user - authentication required
   */
  static async getCurrentUserRequired(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // First ensure we have optional auth
      if (!req.user) {
        await AuthDependencies.getCurrentUserOptional(req, res, () => {});
      }

      if (!req.user) {
        res.status(401).json({
          error: 'Authentication required',
          message: 'Please provide a valid JWT token in Authorization header'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Required auth error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Require admin role
   */
  static async requireAdmin(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // First ensure we have required auth
      if (!req.user) {
        await AuthDependencies.getCurrentUserRequired(req, res, () => {});
        if (!req.user) return; // Response already sent
      }

      if (req.user.role !== 'admin') {
        logger.warn('Admin access denied', { 
          userId: req.user.id, 
          role: req.user.role 
        });
        
        res.status(403).json({
          error: 'Admin access required',
          message: 'You must have admin privileges to access this resource'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Admin auth error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Require specific role
   */
  static requireRole(...roles: string[]) {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        // First ensure we have required auth
        if (!req.user) {
          await AuthDependencies.getCurrentUserRequired(req, res, () => {});
          if (!req.user) return; // Response already sent
        }

        if (!roles.includes(req.user.role)) {
          logger.warn('Role access denied', { 
            userId: req.user.id, 
            userRole: req.user.role,
            requiredRoles: roles 
          });
          
          res.status(403).json({
            error: 'Insufficient permissions',
            message: `This resource requires one of the following roles: ${roles.join(', ')}`
          });
          return;
        }

        next();
      } catch (error) {
        logger.error('Role auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    };
  }
}

// Export middleware functions for convenience
export const auth = {
  verifyApiKey: AuthDependencies.verifyApiKey,
  getCurrentUserOptional: AuthDependencies.getCurrentUserOptional,
  getCurrentUserRequired: AuthDependencies.getCurrentUserRequired,
  requireAdmin: AuthDependencies.requireAdmin,
  requireRole: AuthDependencies.requireRole
};