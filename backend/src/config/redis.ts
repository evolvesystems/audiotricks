import Redis from 'ioredis';
import { logger } from '../utils/logger';

/**
 * Redis configuration and connection management
 * Redis is optional - the app will continue working without it
 */

let redisInstance: Redis | null = null;
let redisEnabled = process.env.DISABLE_REDIS !== 'true';

/**
 * Creates and configures a Redis client instance
 * @returns Configured Redis client
 */
function createRedisClient(): Redis {
  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    // Connection timeout
    connectTimeout: 10000,
    // Command timeout
    commandTimeout: 5000,
    // Retry strategy
    retryDelayOnClusterDown: 300,
    enableOfflineQueue: false,
    // Don't retry connecting forever
    retryStrategy: (times: number) => {
      if (times > 3) {
        logger.warn('Redis connection failed after 3 attempts, disabling Redis');
        redisEnabled = false;
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    }
  };

  const redis = new Redis(redisConfig);

  // Event handlers
  redis.on('connect', () => {
    logger.info('Redis connection established');
  });

  redis.on('ready', () => {
    logger.info('Redis client ready');
  });

  redis.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  redis.on('close', () => {
    logger.info('Redis connection closed');
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return redis;
}

/**
 * Get Redis client instance (singleton)
 * Returns null if Redis is disabled
 */
function getRedisInstance(): Redis | null {
  if (!redisEnabled) {
    return null;
  }
  
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  
  return redisInstance;
}

export const redis = getRedisInstance();

/**
 * Tests Redis connection
 * @returns Promise<boolean> - True if connection successful
 */
export async function testRedisConnection(): Promise<boolean> {
  if (!redisEnabled || !redis) {
    logger.info('Redis is disabled or not available');
    return false;
  }
  
  try {
    await redis.ping();
    logger.info('Redis connection test successful');
    return true;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    redisEnabled = false; // Disable Redis on connection failure
    return false;
  }
}

/**
 * Gracefully closes Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  if (!redis) {
    return;
  }
  
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
}

/**
 * Check if Redis is enabled and available
 */
export function isRedisEnabled(): boolean {
  return redisEnabled && redis !== null;
}