import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/environment.js';
import { testDatabaseConnection, closeDatabaseConnection, prisma } from './config/database.js';
import { redis, testRedisConnection, closeRedisConnection } from './config/redis';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler as _notFoundHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/api/index.js';
import { createHealthRoutes } from './routes/health.routes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

// Rate limiting (temporarily increased for development)
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS * 10, // Increased for development
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes (no auth required)
app.use('/health', createHealthRoutes(prisma, redis));

// API routes (all require API key authentication)
app.use('/api', apiRouter);

// CRITICAL: Serve frontend build from backend (ONE PORT ONLY)
const frontendPath = path.join(__dirname, '../../dist');
app.use(express.static(frontendPath));

// API 404 handler (before catch-all)
app.use('/api/*', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Serve frontend for all non-API routes (SPA routing)
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Error handling
app.use(errorHandler);

// Server startup
async function startServer() {
  try {
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
      logger.warn('Redis connection failed - continuing without Redis');
    }

    app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info(`Frontend URL: ${env.FRONTEND_URL}`);
      logger.info(`Health checks available at: http://localhost:${env.PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await Promise.all([
    closeDatabaseConnection(),
    closeRedisConnection()
  ]);
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await Promise.all([
    closeDatabaseConnection(),
    closeRedisConnection()
  ]);
  process.exit(0);
});

startServer();