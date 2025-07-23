import * as jwt from 'jsonwebtoken';
import { authSettings } from './config.js';
import { logger } from '../../utils/logger.js';

export interface JWTPayload {
  sub: string; // user id
  email?: string;
  role?: string;
  sessionId?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export class JWTManager {
  /**
   * Create a JWT access token
   */
  static createAccessToken(data: {
    userId: string;
    email?: string;
    role?: string;
    sessionId?: string;
  }): string {
    const payload: JWTPayload = {
      sub: data.userId,
      email: data.email,
      role: data.role || 'user',
      sessionId: data.sessionId,
      type: 'access'
    };

    return jwt.sign(payload, authSettings.jwtSecretKey, {
      algorithm: authSettings.jwtAlgorithm as jwt.Algorithm,
      expiresIn: `${authSettings.jwtExpireMinutes}m`
    });
  }

  /**
   * Create a refresh token (longer expiry)
   */
  static createRefreshToken(userId: string, sessionId: string): string {
    const payload: JWTPayload = {
      sub: userId,
      sessionId,
      type: 'refresh'
    };

    return jwt.sign(payload, authSettings.jwtSecretKey, {
      algorithm: authSettings.jwtAlgorithm as jwt.Algorithm,
      expiresIn: '30d' // 30 days for refresh tokens
    });
  }

  /**
   * Decode and validate JWT token
   */
  static decodeAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, authSettings.jwtSecretKey, {
        algorithms: [authSettings.jwtAlgorithm as jwt.Algorithm]
      }) as JWTPayload;

      // Additional validation
      if (payload.type !== 'access') {
        logger.warn('Invalid token type:', payload.type);
        return null;
      }

      return payload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.debug('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        logger.debug('Invalid token');
      } else {
        logger.error('Token decode error:', error);
      }
      return null;
    }
  }

  /**
   * Decode refresh token
   */
  static decodeRefreshToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, authSettings.jwtSecretKey, {
        algorithms: [authSettings.jwtAlgorithm as jwt.Algorithm]
      }) as JWTPayload;

      // Additional validation
      if (payload.type !== 'refresh') {
        logger.warn('Invalid token type for refresh:', payload.type);
        return null;
      }

      return payload;
    } catch (error) {
      logger.debug('Invalid refresh token');
      return null;
    }
  }

  /**
   * Generate token expiry date
   */
  static getTokenExpiry(minutes?: number): Date {
    const expiryMinutes = minutes || authSettings.jwtExpireMinutes;
    return new Date(Date.now() + expiryMinutes * 60 * 1000);
  }
}