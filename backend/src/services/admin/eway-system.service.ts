/**
 * Admin eWAY System Service
 * Handles system monitoring, webhook events, and health checks for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminEwaySystemService {
  /**
   * Get webhook events with pagination and filtering
   */
  async getWebhookEvents(queryParams: any) {
    const {
      page = 1,
      limit = 20,
      status,
      eventType,
      startDate,
      endDate
    } = queryParams;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (eventType) {
      where.eventType = eventType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [events, total] = await Promise.all([
      prisma.ewayWebhookEvent.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.ewayWebhookEvent.count({ where })
    ]);

    return {
      events: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        payload: event.payload,
        response: event.response,
        retryCount: event.retryCount,
        createdAt: event.createdAt,
        processedAt: event.processedAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Retry failed webhook event
   */
  async retryWebhookEvent(eventId: string) {
    try {
      const event = await prisma.ewayWebhookEvent.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new Error('Webhook event not found');
      }

      if (event.status === 'processed') {
        throw new Error('Event already processed successfully');
      }

      // Update retry count
      const updatedEvent = await prisma.ewayWebhookEvent.update({
        where: { id: eventId },
        data: {
          retryCount: event.retryCount + 1,
          status: 'pending'
        }
      });

      // TODO: Trigger webhook processing here
      // This would typically involve queuing the event for reprocessing
      logger.info(`Webhook event ${eventId} queued for retry`);

      return {
        id: updatedEvent.id,
        status: updatedEvent.status,
        retryCount: updatedEvent.retryCount,
        message: 'Event queued for retry'
      };
    } catch (error) {
      logger.error(`Error retrying webhook event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Get eWAY system health status
   */
  async getSystemHealth() {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const [
        recentTransactions,
        failedTransactions,
        pendingWebhooks,
        failedWebhooks,
        systemStatus
      ] = await Promise.all([
        // Recent transaction count
        prisma.ewayTransaction.count({
          where: {
            createdAt: { gte: oneDayAgo }
          }
        }),
        // Failed transactions in last 24h
        prisma.ewayTransaction.count({
          where: {
            transactionStatus: 'failed',
            createdAt: { gte: oneDayAgo }
          }
        }),
        // Pending webhooks
        prisma.ewayWebhookEvent.count({
          where: {
            status: 'pending'
          }
        }),
        // Failed webhooks in last hour
        prisma.ewayWebhookEvent.count({
          where: {
            status: 'failed',
            createdAt: { gte: oneHourAgo }
          }
        }),
        // Get latest system status entry (if exists)
        prisma.systemStatus.findFirst({
          where: {
            service: 'eway'
          },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      // Calculate health score
      const failureRate = recentTransactions > 0 
        ? (failedTransactions / recentTransactions) * 100 
        : 0;
      
      let healthStatus = 'healthy';
      if (failureRate > 10 || failedWebhooks > 5 || pendingWebhooks > 20) {
        healthStatus = 'warning';
      }
      if (failureRate > 25 || failedWebhooks > 15 || pendingWebhooks > 50) {
        healthStatus = 'critical';
      }

      return {
        status: healthStatus,
        lastChecked: now,
        metrics: {
          transactionsLast24h: recentTransactions,
          failedTransactionsLast24h: failedTransactions,
          failureRate: parseFloat(failureRate.toFixed(2)),
          pendingWebhooks,
          failedWebhooksLastHour: failedWebhooks
        },
        systemStatus: systemStatus ? {
          version: systemStatus.version,
          uptime: systemStatus.uptime,
          lastRestart: systemStatus.lastRestart
        } : null,
        alerts: this.generateHealthAlerts(failureRate, failedWebhooks, pendingWebhooks)
      };
    } catch (error) {
      logger.error('Error checking eWAY system health:', error);
      return {
        status: 'error',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: null,
        systemStatus: null,
        alerts: ['System health check failed']
      };
    }
  }

  /**
   * Generate health alerts based on metrics
   */
  private generateHealthAlerts(failureRate: number, failedWebhooks: number, pendingWebhooks: number): string[] {
    const alerts: string[] = [];

    if (failureRate > 25) {
      alerts.push(`Critical: Transaction failure rate is ${failureRate.toFixed(1)}%`);
    } else if (failureRate > 10) {
      alerts.push(`Warning: Transaction failure rate is ${failureRate.toFixed(1)}%`);
    }

    if (failedWebhooks > 15) {
      alerts.push(`Critical: ${failedWebhooks} webhook failures in the last hour`);
    } else if (failedWebhooks > 5) {
      alerts.push(`Warning: ${failedWebhooks} webhook failures in the last hour`);
    }

    if (pendingWebhooks > 50) {
      alerts.push(`Critical: ${pendingWebhooks} webhooks pending processing`);
    } else if (pendingWebhooks > 20) {
      alerts.push(`Warning: ${pendingWebhooks} webhooks pending processing`);
    }

    return alerts;
  }
}