import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Creates and configures a Prisma client instance with DigitalOcean connection pooling
 * @returns Configured Prisma client optimized for PgBouncer
 */
function createPrismaClient(): PrismaClient {
  // Use connection pooled URL for better connection management
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Optimize for connection pooling
    transactionOptions: {
      timeout: 10000, // 10 second timeout
    },
  });

  // Add connection lifecycle logging using process events
  if (process.env.NODE_ENV === 'development') {
    process.on('beforeExit', async () => {
      logger.info('Process exiting, disconnecting Prisma client...');
      await closeDatabaseConnection();
    });
  }

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