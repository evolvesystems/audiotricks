import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/environment.js';
import { hashToken } from '../utils/encryption.js';

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
}

interface JWTPayload {
  userId: string;
  sessionId: string;
}

/**
 * Middleware to verify JWT token and authenticate requests
 */
export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.cookies?.token;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    
    const tokenHash = hashToken(token);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }

    if (!session.user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    req.user = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username,
      role: session.user.role,
      isActive: session.user.isActive
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    next(error);
  }
}

/**
 * Optional authentication - continues even if no valid token
 */
export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.cookies?.token;

    if (!token) {
      next();
      return;
    }

    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.userId = payload.userId;
    req.sessionId = payload.sessionId;
    
    next();
  } catch {
    next();
  }
}