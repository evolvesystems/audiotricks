/**
 * Centralized auth module - all auth logic lives here
 */
export { authSettings } from './config';
export { auth, AuthDependencies, AuthRequest, AuthUser } from './dependencies';
export { JWTManager, JWTPayload } from './jwt';
export { APIKeyManager } from './api-keys';

// Re-export types
export type { AuthSettings } from './config';