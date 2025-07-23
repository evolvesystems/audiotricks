/**
 * Centralized auth module - all auth logic lives here
 */
export { authSettings } from './config.js';
export { auth, AuthDependencies, AuthRequest, AuthUser } from './dependencies.js';
export { JWTManager, JWTPayload } from './jwt.js';
export { APIKeyManager } from './api-keys.js';

// Re-export types
export type { AuthSettings } from './config.js';