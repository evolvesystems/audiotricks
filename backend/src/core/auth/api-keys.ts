import crypto from 'crypto';
import { logger } from '../../utils/logger';

export class APIKeyManager {
  /**
   * Generate a new API key with prefix
   */
  static generateApiKey(prefix: string = 'atk'): string {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
  }
  
  /**
   * Hash API key for storage
   */
  static hashApiKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
  
  /**
   * Constant-time comparison of API keys
   */
  static validateApiKey(apiKey: string, validKeys: string[]): boolean {
    if (!apiKey || validKeys.length === 0) {
      return false;
    }

    for (const validKey of validKeys) {
      try {
        // Use crypto.timingSafeEqual for constant-time comparison
        const apiKeyBuffer = Buffer.from(apiKey);
        const validKeyBuffer = Buffer.from(validKey);
        
        // Keys must be same length for timingSafeEqual
        if (apiKeyBuffer.length !== validKeyBuffer.length) {
          continue;
        }
        
        if (crypto.timingSafeEqual(apiKeyBuffer, validKeyBuffer)) {
          return true;
        }
      } catch (error) {
        // Continue to next key if comparison fails
        logger.error('Error comparing API keys:', error);
        continue;
      }
    }
    
    return false;
  }

  /**
   * Extract key prefix for logging (safely)
   */
  static getKeyPrefix(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) {
      return '****';
    }
    // Show prefix and first 4 chars, mask the rest
    const parts = apiKey.split('_');
    if (parts.length > 1) {
      return `${parts[0]}_${parts[1].substring(0, 4)}****`;
    }
    return apiKey.substring(0, 4) + '****';
  }
}