import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Creates and configures a Prisma client instance with connection pooling
 * @returns Configured Prisma client
 */
function createPrismaClient(): PrismaClient {
  // Build DATABASE_URL with connection pooling parameters
  const databaseUrl = process.env.DATABASE_URL || '';
  const pooledUrl = databaseUrl.includes('?') 
    ? `${databaseUrl}&connection_limit=10&pool_timeout=10s&pgbouncer=true`
    : `${databaseUrl}?connection_limit=10&pool_timeout=10s&pgbouncer=true`;

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    datasources: {
      db: {
        url: pooledUrl,
      },
    },
  });

  return prisma;
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Tests database connection
 * @returns Promise<boolean> - True if connection successful
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    return false;
  }
}

/**
 * Gracefully closes database connection
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
}