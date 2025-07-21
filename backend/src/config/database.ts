import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Creates and configures a Prisma client instance
 * @returns Configured Prisma client
 */
function createPrismaClient(): PrismaClient {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
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