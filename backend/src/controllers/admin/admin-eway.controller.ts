/**
 * Admin eWAY payment gateway management controller
 * Orchestrates admin operations for eWAY transactions, customers, and monitoring
 */

import { Request, Response } from 'express';
import { AdminEwayTransactionService } from '../../services/admin/eway-transaction.service';
import { AdminEwayCustomerService } from '../../services/admin/eway-customer.service';
import { AdminEwaySystemService } from '../../services/admin/eway-system.service';
import { AdminEwayConfigService } from '../../services/admin/eway-config.service';
import { logger } from '../../utils/logger';

export class AdminEwayController {
  private transactionService: AdminEwayTransactionService;
  private customerService: AdminEwayCustomerService;
  private systemService: AdminEwaySystemService;
  private configService: AdminEwayConfigService;

  constructor() {
    this.transactionService = new AdminEwayTransactionService();
    this.customerService = new AdminEwayCustomerService();
    this.systemService = new AdminEwaySystemService();
    this.configService = new AdminEwayConfigService();
  }

  /**
   * Get eWAY transaction overview for admin dashboard
   */
  async getTransactionOverview(req: Request, res: Response) {
    try {
      const { timeframe = '30days' } = req.query;
      const overview = await this.transactionService.getOverview(timeframe as string);
      
      res.json({
        success: true,
        data: overview
      });
    } catch (error) {
      logger.error('Error fetching eWAY transaction overview:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get paginated list of eWAY transactions
   */
  async getTransactions(req: Request, res: Response) {
    try {
      const transactions = await this.transactionService.getTransactions(req.query);
      
      res.json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error('Error fetching eWAY transactions:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get eWAY customer information
   */
  async getCustomers(req: Request, res: Response) {
    try {
      const customers = await this.customerService.getCustomers(req.query);
      
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      logger.error('Error fetching eWAY customers:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get recurring payment schedules
   */
  async getRecurringSchedules(req: Request, res: Response) {
    try {
      const schedules = await this.customerService.getRecurringSchedules(req.query);
      
      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      logger.error('Error fetching recurring schedules:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get webhook events and logs
   */
  async getWebhookEvents(req: Request, res: Response) {
    try {
      const events = await this.systemService.getWebhookEvents(req.query);
      
      res.json({
        success: true,
        data: events
      });
    } catch (error) {
      logger.error('Error fetching webhook events:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Retry failed webhook event
   */
  async retryWebhookEvent(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const result = await this.systemService.retryWebhookEvent(eventId);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error retrying webhook event:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get eWAY system health status
   */
  async getSystemHealth(_req: Request, res: Response) {
    try {
      const health = await this.systemService.getSystemHealth();
      
      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      logger.error('Error fetching eWAY system health:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get eWAY configuration
   */
  async getConfig(req: Request, res: Response) {
    try {
      const config = await this.configService.getConfig(req.query);
      
      res.json({
        success: true,
        data: config
      });
    } catch (error) {
      logger.error('Error fetching eWAY config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save eWAY configuration
   */
  async saveConfig(req: Request, res: Response) {
    try {
      const result = await this.configService.saveConfig(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error saving eWAY config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test eWAY configuration
   */
  async testConfig(req: Request, res: Response) {
    try {
      const result = await this.configService.testConfig(req.body);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error testing eWAY config:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}