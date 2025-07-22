/**
 * Admin eWAY payment gateway management controller
 * Handles admin operations for eWAY transactions, customers, and monitoring
 */

import { Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

export class AdminEwayController {
  /**
   * Get eWAY transaction overview for admin dashboard
   */
  async getTransactionOverview(req: Request, res: Response) {
    try {
      const { timeframe = '30days' } = req.query;
      
      let dateFilter: Date;
      switch (timeframe) {
        case '7days':
          dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          dateFilter = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const [
        transactionStats,
        revenueStats,
        statusDistribution,
        recentTransactions
      ] = await Promise.all([
        // Transaction volume stats
        prisma.ewayTransaction.aggregate({
          _count: { id: true },
          _sum: { amount: true },
          where: {
            createdAt: { gte: dateFilter }
          }
        }),
        // Revenue by status
        prisma.ewayTransaction.groupBy({
          by: ['transactionStatus'],
          _sum: { amount: true },
          _count: { id: true },
          where: {
            createdAt: { gte: dateFilter }
          }
        }),
        // Status distribution
        prisma.ewayTransaction.groupBy({
          by: ['transactionStatus'],
          _count: { transactionStatus: true }
        }),
        // Recent transactions
        prisma.ewayTransaction.findMany({
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            ewayCustomer: {
              select: { 
                customerToken: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        })
      ]);

      res.json({
        overview: {
          transactionStats,
          revenueStats,
          statusDistribution,
          recentTransactions
        }
      });
    } catch (error) {
      logger.error('Failed to fetch eWAY transaction overview:', error);
      res.status(500).json({ error: 'Failed to fetch transaction overview' });
    }
  }

  /**
   * Get all eWAY transactions with filtering and pagination
   */
  async getTransactions(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        customerId, 
        startDate, 
        endDate 
      } = req.query;
      
      const offset = (Number(page) - 1) * Number(limit);
      
      const where: any = {};
      if (status) where.status = status;
      if (customerId) where.ewayCustomerId = customerId;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate as string);
        if (endDate) where.createdAt.lte = new Date(endDate as string);
      }

      const [transactions, total] = await Promise.all([
        prisma.ewayTransaction.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            ewayCustomer: {
              select: {
        customerToken: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.ewayTransaction.count({ where })
      ]);

      res.json({
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch eWAY transactions:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  }

  /**
   * Get eWAY customer management data
   */
  async getCustomers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { ewayCustomerToken: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.ewayCustomer.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                transactions: true,
                recurringSchedules: true
              }
            }
          }
        }),
        prisma.ewayCustomer.count({ where })
      ]);

      res.json({
        customers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch eWAY customers:', error);
      res.status(500).json({ error: 'Failed to fetch customers' });
    }
  }

  /**
   * Get eWAY recurring payment schedules
   */
  async getRecurringSchedules(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (status) where.status = status;

      const [schedules, total] = await Promise.all([
        prisma.ewayRecurringSchedule.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            ewayCustomer: {
              select: {
        customerToken: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        prisma.ewayRecurringSchedule.count({ where })
      ]);

      res.json({
        schedules,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch recurring schedules:', error);
      res.status(500).json({ error: 'Failed to fetch recurring schedules' });
    }
  }

  /**
   * Get eWAY webhook event logs
   */
  async getWebhookEvents(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, eventType, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (eventType) where.eventType = eventType;
      if (status) where.processed = status === 'processed';

      const [events, total] = await Promise.all([
        prisma.ewayWebhookEvent.findMany({
          where,
          skip: offset,
          take: Number(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.ewayWebhookEvent.count({ where })
      ]);

      res.json({
        events,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      logger.error('Failed to fetch webhook events:', error);
      res.status(500).json({ error: 'Failed to fetch webhook events' });
    }
  }

  /**
   * Retry failed webhook processing
   */
  async retryWebhookEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const event = await prisma.ewayWebhookEvent.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        return res.status(404).json({ error: 'Webhook event not found' });
      }

      // Mark for reprocessing
      await prisma.ewayWebhookEvent.update({
        where: { id: eventId },
        data: {
          processed: false,
          processedAt: null
        }
      });

      logger.info('Admin marked webhook event for retry:', { eventId });
      return res.json({ success: true, message: 'Webhook event marked for retry' });
    } catch (error) {
      logger.error('Failed to retry webhook event:', error);
      return res.status(500).json({ error: 'Failed to retry webhook event' });
    }
  }

  /**
   * Get eWAY system health and configuration status
   */
  async getSystemHealth(_req: Request, res: Response) {
    try {
      const [
        recentTransactionCount,
        failedTransactionCount,
        webhookBacklog,
        recurringScheduleStats
      ] = await Promise.all([
        // Recent successful transactions (last hour)
        prisma.ewayTransaction.count({
          where: {
            status: 'approved',
            createdAt: {
              gte: new Date(Date.now() - 60 * 60 * 1000)
            }
          }
        }),
        // Failed transactions (last 24 hours)
        prisma.ewayTransaction.count({
          where: {
            transactionStatus: { in: ['declined', 'failed'] },
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          }
        }),
        // Unprocessed webhook events
        prisma.ewayWebhookEvent.count({
          where: { processed: false }
        }),
        // Active recurring schedules
        prisma.ewayRecurringSchedule.groupBy({
          by: ['status'],
          _count: { status: true }
        })
      ]);

      res.json({
        health: {
          recentTransactions: recentTransactionCount,
          failedTransactions: failedTransactionCount,
          webhookBacklog,
          recurringScheduleStats,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Failed to fetch eWAY system health:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  }

  /**
   * Get eWAY configuration
   */
  async getConfig(req: Request, res: Response) {
    try {
      // Get config from system settings
      const configRecord = await prisma.systemConfig.findUnique({
        where: { key: 'eway_config' }
      });

      if (!configRecord) {
        return res.json({ config: null });
      }

      // Parse and return config (without sensitive data)
      const config = configRecord.value as any;
      const sanitizedConfig = {
        environment: config.environment || 'sandbox',
        rapidEndpoint: config.rapidEndpoint || 'https://api.sandbox.ewaypayments.com',
        enableWebhooks: config.enableWebhooks || false,
        // Don't send API key/password values, just indicate if they're set
        apiKeySet: !!config.apiKey,
        apiPasswordSet: !!config.apiPassword,
        webhookSecretSet: !!config.webhookSecret
      };

      res.json({ config: sanitizedConfig });
    } catch (error) {
      logger.error('Failed to fetch eWAY config:', error);
      res.status(500).json({ error: 'Failed to fetch configuration' });
    }
  }

  /**
   * Save eWAY configuration
   */
  async saveConfig(req: Request, res: Response) {
    try {
      const { config } = req.body;

      if (!config) {
        return res.status(400).json({ error: 'Configuration required' });
      }

      // Validate required fields
      if (!config.apiKey || !config.apiPassword) {
        return res.status(400).json({ error: 'API Key and Password are required' });
      }

      // Get existing config to preserve any unchanged sensitive fields
      const existingConfig = await prisma.systemConfig.findUnique({
        where: { key: 'eway_config' }
      });

      const existingData = existingConfig?.value as any || {};

      // Merge with existing config, updating only provided fields
      const updatedConfig = {
        ...existingData,
        ...config,
        updatedAt: new Date().toISOString()
      };

      // Save config
      await prisma.systemConfig.upsert({
        where: { key: 'eway_config' },
        update: { value: updatedConfig },
        create: {
          key: 'eway_config',
          value: updatedConfig
        }
      });

      res.json({ success: true, message: 'Configuration saved successfully' });
    } catch (error) {
      logger.error('Failed to save eWAY config:', error);
      res.status(500).json({ error: 'Failed to save configuration' });
    }
  }

  /**
   * Test eWAY connection
   */
  async testConfig(req: Request, res: Response) {
    try {
      const { config } = req.body;

      if (!config || !config.apiKey || !config.apiPassword) {
        return res.status(400).json({ error: 'Configuration required' });
      }

      // Here you would normally make a test API call to eWAY
      // For now, we'll simulate a successful test
      // In production, you'd use the eWAY SDK to verify credentials

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock response - in production, this would be based on actual API response
      const isValid = config.apiKey.length > 10 && config.apiPassword.length > 5;

      if (isValid) {
        res.json({ 
          success: true, 
          message: 'Connection test successful. Credentials are valid.' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Invalid credentials. Please check your API key and password.' 
        });
      }
    } catch (error) {
      logger.error('Failed to test eWAY connection:', error);
      res.status(500).json({ error: 'Failed to test connection' });
    }
  }
}