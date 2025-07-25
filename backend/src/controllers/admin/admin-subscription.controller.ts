/**
 * Admin subscription management controller
 * Orchestrates admin operations for subscription plans, billing, and analytics
 */

import { Request, Response } from 'express';
import { AdminSubscriptionPlanService } from '../../services/admin/subscription-plan.service';
import { AdminSubscriptionManagementService } from '../../services/admin/subscription-management.service';
import { AdminBillingAnalyticsService } from '../../services/admin/billing-analytics.service';
import { logger } from '../../utils/logger';

export class AdminSubscriptionController {
  private planService: AdminSubscriptionPlanService;
  private managementService: AdminSubscriptionManagementService;
  private analyticsService: AdminBillingAnalyticsService;

  constructor() {
    this.planService = new AdminSubscriptionPlanService();
    this.managementService = new AdminSubscriptionManagementService();
    this.analyticsService = new AdminBillingAnalyticsService();
  }

  /**
   * Get all subscription plans for admin management
   */
  async getSubscriptionPlans(_req: Request, res: Response) {
    try {
      const plans = await this.planService.getAllPlans();
      
      res.json({
        plans
      });
    } catch (error) {
      logger.error('Error fetching subscription plans:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create new subscription plan
   */
  async createSubscriptionPlan(req: Request, res: Response) {
    try {
      const planData = req.body;
      const newPlan = await this.planService.createPlan(planData);
      
      res.status(201).json({
        success: true,
        plan: newPlan
      });
    } catch (error) {
      logger.error('Error creating subscription plan:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update existing subscription plan
   */
  async updateSubscriptionPlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      const updateData = req.body;
      
      const updatedPlan = await this.planService.updatePlan(planId, updateData);
      
      res.json({
        success: true,
        plan: updatedPlan
      });
    } catch (error) {
      logger.error('Error updating subscription plan:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete subscription plan
   */
  async deleteSubscriptionPlan(req: Request, res: Response) {
    try {
      const { planId } = req.params;
      
      await this.planService.deletePlan(planId);
      
      res.json({
        success: true,
        message: 'Subscription plan deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting subscription plan:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all subscriptions with filtering and pagination
   */
  async getAllSubscriptions(req: Request, res: Response) {
    try {
      const subscriptions = await this.managementService.getAllSubscriptions(req.query);
      
      res.json(subscriptions);
    } catch (error) {
      logger.error('Error fetching subscriptions:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get billing analytics for admin dashboard
   */
  async getBillingAnalytics(_req: Request, res: Response) {
    try {
      const analytics = await this.analyticsService.getBillingAnalytics();
      
      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching billing analytics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get usage analytics for admin dashboard
   */
  async getUsageAnalytics(_req: Request, res: Response) {
    try {
      const analytics = await this.analyticsService.getUsageAnalytics();
      
      res.json(analytics);
    } catch (error) {
      logger.error('Error fetching usage analytics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}