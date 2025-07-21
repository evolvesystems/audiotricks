import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { HealthController } from '../controllers/health.controller';

/**
 * Health check routes
 * Provides various health check endpoints for monitoring and orchestration
 */
export function createHealthRoutes(prisma: PrismaClient, redis: Redis): Router {
  const router = Router();
  const healthController = new HealthController(prisma, redis);

  /**
   * GET /health
   * Basic health check - returns 200 if service is running
   */
  router.get('/', healthController.basicHealth.bind(healthController));

  /**
   * GET /health/detailed
   * Comprehensive health check with database, Redis, and system metrics
   */
  router.get('/detailed', healthController.detailedHealth.bind(healthController));

  /**
   * GET /health/ready
   * Readiness probe - checks if service is ready to accept traffic
   * Used by container orchestrators to determine when to send traffic
   */
  router.get('/ready', healthController.readiness.bind(healthController));

  /**
   * GET /health/live
   * Liveness probe - checks if service is alive
   * Used by container orchestrators to determine when to restart
   */
  router.get('/live', healthController.liveness.bind(healthController));

  /**
   * GET /health/metrics
   * Metrics endpoint in Prometheus format
   * Used by monitoring systems to collect metrics
   */
  router.get('/metrics', healthController.metrics.bind(healthController));

  return router;
}