import { Request, Response, NextFunction } from 'express';
import { UsageTrackingService } from '../services/usage/usage-tracking.service';
import { logger } from '../utils/logger';

const usageTracking = new UsageTrackingService();

export interface QuotaCheckOptions {
  resourceType: 'storage' | 'processing' | 'apiCalls' | 'transcription' | 'aiTokens';
  getAmount?: (req: Request) => number;
  workspaceIdParam?: string;
}

/**
 * Middleware to check quota before allowing operations
 */
export function checkQuota(options: QuotaCheckOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get workspace ID from request
      const workspaceIdParam = options.workspaceIdParam || 'workspaceId';
      const workspaceId = req.body[workspaceIdParam] || 
                         req.params[workspaceIdParam] || 
                         req.query[workspaceIdParam] as string;

      if (!workspaceId) {
        logger.warn('No workspace ID found for quota check');
        return next(); // Allow request if no workspace ID
      }

      // Get amount to check
      const amount = options.getAmount ? options.getAmount(req) : 1;

      // Check quota
      const quotaResult = await usageTracking.enforceQuota(
        workspaceId,
        options.resourceType,
        amount
      );

      if (!quotaResult.allowed) {
        res.status(429).json({
          error: 'Quota exceeded',
          message: quotaResult.reason,
          suggestion: quotaResult.suggestion,
          quotaType: options.resourceType
        });
        return;
      }

      // Add quota info to request for logging
      (req as any).quotaCheck = {
        workspaceId,
        resourceType: options.resourceType,
        amount
      };

      next();
    } catch (error) {
      logger.error('Quota check failed', { error });
      // Allow request on error to avoid blocking users
      next();
    }
  };
}

/**
 * Track usage after successful operation
 */
export function trackUsage(
  resourceType: string,
  getAmount?: (req: Request, res: Response) => number
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to track usage on success
    res.json = function(data: any) {
      // Check if response is successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const quotaCheck = (req as any).quotaCheck;
        
        if (quotaCheck) {
          const amount = getAmount ? getAmount(req, res) : quotaCheck.amount;
          
          // Track usage asynchronously
          usageTracking.trackUsage(
            quotaCheck.workspaceId,
            resourceType,
            amount,
            {
              endpoint: req.originalUrl,
              method: req.method,
              userId: (req as any).user?.id
            }
          ).catch(error => {
            logger.error('Failed to track usage', { error });
          });
        }
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Quota middleware for file uploads
 */
export const quotaUpload = checkQuota({
  resourceType: 'storage',
  getAmount: (req) => {
    const fileSize = req.body.fileSize || 0;
    return parseInt(fileSize);
  }
});

/**
 * Quota middleware for transcription
 */
export const quotaTranscription = checkQuota({
  resourceType: 'transcription',
  getAmount: (req) => {
    // Estimate based on file size (rough calculation)
    const fileSize = req.body.fileSize || 0;
    const estimatedMinutes = Math.ceil(fileSize / (1024 * 1024 * 10)); // 10MB per minute estimate
    return estimatedMinutes;
  }
});

/**
 * Quota middleware for API calls
 */
export const quotaApiCall = checkQuota({
  resourceType: 'apiCalls',
  getAmount: () => 1
});

/**
 * Quota middleware for AI tokens
 */
export const quotaAiTokens = checkQuota({
  resourceType: 'aiTokens',
  getAmount: (req) => {
    // Estimate tokens based on text length
    const text = req.body.text || req.body.transcript || '';
    const estimatedTokens = Math.ceil(text.length / 4); // Rough estimate
    return estimatedTokens;
  }
});