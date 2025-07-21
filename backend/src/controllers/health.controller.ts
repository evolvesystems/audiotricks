import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { getErrorMessage } from '../utils/error-handler';

/**
 * Health check controller for monitoring service status
 */
export class HealthController {
  private prisma: PrismaClient;
  private redis: Redis | null;

  constructor(prisma: PrismaClient, redis: Redis | null) {
    this.prisma = prisma;
    this.redis = redis;
  }

  /**
   * Basic health check endpoint
   * Returns 200 OK if service is running
   */
  async basicHealth(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AudioTricks Backend API',
      version: process.env.npm_package_version || '1.0.0'
    });
    return;
  }

  /**
   * Detailed health check with database and Redis connectivity
   * Returns comprehensive health status
   */
  async detailedHealth(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const healthStatus: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'AudioTricks Backend API',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {}
    };

    // Database health check
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      healthStatus.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      healthStatus.status = 'unhealthy';
      healthStatus.checks.database = {
        status: 'unhealthy',
        error: getErrorMessage(error),
        responseTime: Date.now() - startTime
      };
    }

    // Redis health check (optional)
    if (this.redis) {
      const redisStartTime = Date.now();
      try {
        await this.redis.ping();
        healthStatus.checks.redis = {
          status: 'healthy',
          responseTime: Date.now() - redisStartTime
        };
      } catch (error) {
        healthStatus.status = 'degraded';
        healthStatus.checks.redis = {
          status: 'unhealthy',
          error: getErrorMessage(error),
          responseTime: Date.now() - redisStartTime
        };
      }
    } else {
      healthStatus.checks.redis = {
        status: 'disabled',
        message: 'Redis is not configured'
      };
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthStatus.checks.memory = {
      status: 'healthy',
      usage: {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      }
    };

    // Storage connectivity check (if configured)
    if (process.env.DO_SPACES_KEY && process.env.DO_SPACES_SECRET) {
      const storageStartTime = Date.now();
      try {
        // Simple connectivity test to DigitalOcean Spaces
        const response = await fetch(process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com');
        if (response.ok || response.status === 403) { // 403 is expected without auth
          healthStatus.checks.storage = {
            status: 'healthy',
            responseTime: Date.now() - storageStartTime
          };
        } else {
          throw new Error(`Storage endpoint returned ${response.status}`);
        }
      } catch (error) {
        healthStatus.checks.storage = {
          status: 'unhealthy',
          error: getErrorMessage(error),
          responseTime: Date.now() - storageStartTime
        };
      }
    }

    // Overall response time
    healthStatus.responseTime = Date.now() - startTime;

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    return;
  }

  /**
   * Readiness probe for Kubernetes/Docker
   * Checks if service is ready to accept traffic
   */
  async readiness(req: Request, res: Response): Promise<void> {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check Redis connection (if available)
      if (this.redis) {
        await this.redis.ping();
      }

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
      return;
    } catch (error) {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString(),
        error: getErrorMessage(error)
      });
      return;
    }
  }

  /**
   * Liveness probe for Kubernetes/Docker
   * Simple check to verify service is alive
   */
  async liveness(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
    return;
  }

  /**
   * Metrics endpoint for monitoring systems
   * Returns basic metrics in a format suitable for Prometheus
   */
  async metrics(req: Request, res: Response): Promise<void> {
    const memUsage = process.memoryUsage();
    const metrics = [
      `# HELP nodejs_memory_rss_bytes Resident Set Size in bytes`,
      `# TYPE nodejs_memory_rss_bytes gauge`,
      `nodejs_memory_rss_bytes ${memUsage.rss}`,
      ``,
      `# HELP nodejs_memory_heap_total_bytes Total heap size in bytes`,
      `# TYPE nodejs_memory_heap_total_bytes gauge`,
      `nodejs_memory_heap_total_bytes ${memUsage.heapTotal}`,
      ``,
      `# HELP nodejs_memory_heap_used_bytes Used heap size in bytes`,
      `# TYPE nodejs_memory_heap_used_bytes gauge`,
      `nodejs_memory_heap_used_bytes ${memUsage.heapUsed}`,
      ``,
      `# HELP nodejs_uptime_seconds Process uptime in seconds`,
      `# TYPE nodejs_uptime_seconds counter`,
      `nodejs_uptime_seconds ${process.uptime()}`,
      ``
    ].join('\n');

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics);
    return;
  }
}