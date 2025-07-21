import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { env } from '../../config/environment';
import { logger } from '../../utils/logger';
import { getErrorMessage } from '../../utils/error-handler';

const prisma = new PrismaClient();

export interface ApiKeyInfo {
  id: string;
  provider: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: Date | null;
  usageCount: number;
  createdAt: Date;
}

export class ApiKeyService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;
  private saltLength = 32;

  /**
   * Derive encryption key from master key and salt
   */
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(env.ENCRYPTION_KEY, salt, 100000, this.keyLength, 'sha256');
  }

  /**
   * Encrypt an API key
   */
  private encryptKey(apiKey: string): string {
    try {
      const salt = crypto.randomBytes(this.saltLength);
      const key = this.deriveKey(salt);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, key, iv) as crypto.CipherGCM;
      
      const encrypted = Buffer.concat([
        cipher.update(apiKey, 'utf8'),
        cipher.final()
      ]);
      
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      return combined.toString('base64');
    } catch (error) {
      logger.error('Failed to encrypt API key', { error });
      throw new Error('Failed to encrypt API key');
    }
  }

  /**
   * Decrypt an API key
   */
  private decryptKey(encryptedKey: string): string {
    try {
      const combined = Buffer.from(encryptedKey, 'base64');
      
      // Extract components
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const tag = combined.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);
      
      const key = this.deriveKey(salt);
      
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv) as crypto.DecipherGCM;
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Failed to decrypt API key', { error });
      throw new Error('Failed to decrypt API key');
    }
  }

  /**
   * Generate a hash for the API key (for lookups)
   */
  private hashKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  /**
   * Extract key prefix for identification
   */
  private getKeyPrefix(apiKey: string): string {
    // Take first 8 characters, replacing sensitive parts with asterisks
    if (apiKey.length <= 8) {
      return apiKey.substring(0, 4) + '****';
    }
    return apiKey.substring(0, 4) + '****';
  }

  /**
   * Store an API key for a user
   */
  async storeKey(
    userId: string,
    provider: 'openai' | 'elevenlabs' | 'custom',
    apiKey: string,
    metadata?: Record<string, any>
  ): Promise<ApiKeyInfo> {
    try {
      const keyHash = this.hashKey(apiKey);
      const keyPrefix = this.getKeyPrefix(apiKey);
      const encryptedKey = this.encryptKey(apiKey);

      // Check if key already exists
      const existingKey = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider
          }
        }
      });

      let apiKeyRecord;

      if (existingKey) {
        // Update existing key
        apiKeyRecord = await prisma.apiKeyManagement.update({
          where: {
            id: existingKey.id
          },
          data: {
            keyHash,
            keyPrefix,
            encryptedKey,
            isActive: true,
            metadata: metadata || {},
            updatedAt: new Date()
          }
        });

        logger.info('API key updated', {
          userId,
          provider,
          keyPrefix
        });
      } else {
        // Create new key
        apiKeyRecord = await prisma.apiKeyManagement.create({
          data: {
            userId,
            provider,
            keyHash,
            keyPrefix,
            encryptedKey,
            isActive: true,
            metadata: metadata || {}
          }
        });

        logger.info('API key stored', {
          userId,
          provider,
          keyPrefix
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: existingKey ? 'update' : 'create',
          resource: 'api_key',
          resourceId: apiKeyRecord.id,
          metadata: {
            provider,
            keyPrefix
          }
        }
      });

      return {
        id: apiKeyRecord.id,
        provider: apiKeyRecord.provider,
        keyPrefix: apiKeyRecord.keyPrefix,
        isActive: apiKeyRecord.isActive,
        lastUsedAt: apiKeyRecord.lastUsedAt,
        usageCount: apiKeyRecord.usageCount,
        createdAt: apiKeyRecord.createdAt
      };
    } catch (error) {
      logger.error('Failed to store API key', { userId, provider, error });
      throw new Error(`Failed to store API key: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Retrieve and decrypt an API key
   */
  async getKey(userId: string, provider: string): Promise<string | null> {
    try {
      const apiKeyRecord = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider
          }
        }
      });

      if (!apiKeyRecord || !apiKeyRecord.isActive) {
        return null;
      }

      // Update usage stats
      await prisma.apiKeyManagement.update({
        where: { id: apiKeyRecord.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: apiKeyRecord.usageCount + 1
        }
      });

      // Decrypt and return the key
      return this.decryptKey(apiKeyRecord.encryptedKey);
    } catch (error) {
      logger.error('Failed to retrieve API key', { userId, provider, error });
      throw new Error(`Failed to retrieve API key: ${getErrorMessage(error)}`);
    }
  }

  /**
   * List all API keys for a user (without decrypting)
   */
  async listKeys(userId: string): Promise<ApiKeyInfo[]> {
    try {
      const keys = await prisma.apiKeyManagement.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });

      return keys.map(key => ({
        id: key.id,
        provider: key.provider,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
        createdAt: key.createdAt
      }));
    } catch (error) {
      logger.error('Failed to list API keys', { userId, error });
      throw new Error(`Failed to list API keys: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Deactivate an API key
   */
  async deactivateKey(userId: string, provider: string): Promise<void> {
    try {
      const apiKeyRecord = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider
          }
        }
      });

      if (!apiKeyRecord) {
        throw new Error('API key not found');
      }

      await prisma.apiKeyManagement.update({
        where: { id: apiKeyRecord.id },
        data: { isActive: false }
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'delete',
          resource: 'api_key',
          resourceId: apiKeyRecord.id,
          metadata: {
            provider,
            keyPrefix: apiKeyRecord.keyPrefix
          }
        }
      });

      logger.info('API key deactivated', { userId, provider });
    } catch (error) {
      logger.error('Failed to deactivate API key', { userId, provider, error });
      throw new Error(`Failed to deactivate API key: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Validate an API key by testing it
   */
  async validateKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          return await this.validateOpenAIKey(apiKey);
        case 'elevenlabs':
          return await this.validateElevenLabsKey(apiKey);
        default:
          return true; // Custom keys are assumed valid
      }
    } catch (error) {
      logger.error('Failed to validate API key', { provider, error });
      return false;
    }
  }

  /**
   * Validate OpenAI API key
   */
  private async validateOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate ElevenLabs API key
   */
  private async validateElevenLabsKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Log API key usage
   */
  async logUsage(
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTime: number,
    tokensUsed?: number,
    cost?: number,
    error?: string
  ): Promise<void> {
    try {
      await prisma.apiKeyUsageLog.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          statusCode,
          responseTime,
          tokensUsed,
          cost,
          error,
          metadata: {
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to log API key usage', { apiKeyId, error });
      // Don't throw here as this is a non-critical operation
    }
  }

  /**
   * Get usage statistics for an API key
   */
  async getUsageStats(userId: string, provider: string, days: number = 30): Promise<any> {
    try {
      const apiKey = await prisma.apiKeyManagement.findUnique({
        where: {
          userId_provider: {
            userId,
            provider
          }
        }
      });

      if (!apiKey) {
        return null;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const usageLogs = await prisma.apiKeyUsageLog.findMany({
        where: {
          apiKeyId: apiKey.id,
          createdAt: {
            gte: startDate
          }
        }
      });

      const totalCalls = usageLogs.length;
      const totalTokens = usageLogs.reduce((sum, log) => sum + (log.tokensUsed || 0), 0);
      const totalCost = usageLogs.reduce((sum, log) => sum + Number(log.cost || 0), 0);
      const errorCount = usageLogs.filter(log => log.error).length;

      return {
        totalCalls,
        totalTokens,
        totalCost,
        errorCount,
        successRate: totalCalls > 0 ? (totalCalls - errorCount) / totalCalls : 0,
        lastUsed: apiKey.lastUsedAt
      };
    } catch (error) {
      logger.error('Failed to get usage stats', { userId, provider, error });
      throw new Error(`Failed to get usage stats: ${getErrorMessage(error)}`);
    }
  }
}