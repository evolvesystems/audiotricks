/**
 * Centralized auth module - all auth logic lives here
 */
export { authSettings } from './config.js';
export { auth, AuthDependencies } from './dependencies.ts';
export { JWTManager, JWTPayload } from './jwt.js';
export { APIKeyManager } from './api-keys.js';

// Re-export types
export type { AuthSettings } from './config.js';
export type { AuthRequest, AuthUser } from './dependencies.ts';