// Database utilities for Netlify Functions with PgBouncer
const { PrismaClient } = require('@prisma/client');

// Global Prisma instance with connection pooling optimizations
let prisma;

// Connection retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
  factor: 2        // Exponential backoff factor
};

// Initialize Prisma with optimized settings for serverless + PgBouncer
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      // Optimize for serverless/PgBouncer
      transactionOptions: {
        timeout: 30000,    // 30 second timeout
        maxWait: 30000,    // Maximum time to wait for a transaction
        isolationLevel: 'ReadCommitted'
      },
      // Connection pool settings optimized for serverless
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    });
  }
  return prisma;
}

// Exponential backoff delay
function getRetryDelay(attempt) {
  const delay = Math.min(
    RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.factor, attempt - 1),
    RETRY_CONFIG.maxDelay
  );
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

// Execute database query with retry logic
async function executeWithRetry(operation, operationName = 'Database operation') {
  const client = getPrismaClient();
  let lastError;
  
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`${operationName}: Attempt ${attempt}/${RETRY_CONFIG.maxRetries}`);
      
      // Execute the operation
      const result = await operation(client);
      
      // Success - return result
      if (attempt > 1) {
        console.log(`${operationName}: Succeeded on attempt ${attempt}`);
      }
      return result;
      
    } catch (error) {
      lastError = error;
      console.error(`${operationName}: Attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.code === 'P2002') { // Unique constraint violation
        throw error;
      }
      
      // Check if error is retryable
      const isRetryable = 
        error.message.includes('Timed out fetching a new connection') ||
        error.message.includes('connect ETIMEDOUT') ||
        error.message.includes('Connection pool timeout') ||
        error.code === 'P2024'; // Connection pool timeout
      
      if (!isRetryable) {
        throw error;
      }
      
      // If not last attempt, wait before retrying
      if (attempt < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(attempt);
        console.log(`${operationName}: Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error(`${operationName}: All ${RETRY_CONFIG.maxRetries} attempts failed`);
  throw lastError;
}

// Disconnect Prisma client (for cleanup)
async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrismaClient,
  executeWithRetry,
  disconnectPrisma,
  RETRY_CONFIG
};