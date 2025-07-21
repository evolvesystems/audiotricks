import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

export interface SubscriptionPlan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  tier: string;
  features: any;
  quotas: any;
  pricing: {
    currency: string;
    price: number;
    billingPeriod: string;
  }[];
  trialDays: number;
  isActive: boolean;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
}

/**
 * Service for managing subscription plans and pricing
 */
export class PlanService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get all available subscription plans for a given currency and region
   */
  async getAvailablePlans(currency: string = 'AUD', region?: string): Promise<SubscriptionPlan[]> {
    try {
      logger.info('Getting available plans', { currency, region });

      const plans = await this.prisma.subscriptionPlan.findMany({
        where: {
          isActive: true,
          ...(region && {
            allowedRegions: {
              has: region
            }
          })
        },
        include: {
          pricing: {
            where: {
              currency: currency,
              isActive: true
            }
          },
          features: {
            include: {
              feature: true
            }
          }
        },
        orderBy: [
          { tier: 'asc' },
          { sortOrder: 'asc' }
        ]
      });

      return plans.map(plan => this.transformPlanData(plan));
    } catch (error) {
      logger.error('Error getting available plans:', error);
      throw new Error(`Failed to get subscription plans: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get supported currencies with exchange rates
   */
  async getSupportedCurrencies(): Promise<Currency[]> {
    try {
      const currencies = await this.prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' }
      });

      return currencies.map(currency => ({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        exchangeRate: Number(currency.exchangeRate)
      }));
    } catch (error) {
      logger.error('Error getting currencies:', error);
      throw new Error(`Failed to get currencies: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get plan by ID with full details
   */
  async getPlanById(planId: string, currency: string = 'AUD'): Promise<SubscriptionPlan | null> {
    try {
      const plan = await this.prisma.subscriptionPlan.findUnique({
        where: { id: planId },
        include: {
          pricing: {
            where: {
              currency: currency,
              isActive: true
            }
          },
          features: {
            include: {
              feature: true
            }
          }
        }
      });

      return plan ? this.transformPlanData(plan) : null;
    } catch (error) {
      logger.error('Error getting plan by ID:', error);
      throw new Error(`Failed to get plan: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get plan features as readable list
   */
  getPlanFeatures(plan: SubscriptionPlan): string[] {
    const features: string[] = [];
    
    if (plan.features) {
      // Add storage quota
      if (plan.quotas?.maxStorageMb) {
        const storageGb = Math.round(plan.quotas.maxStorageMb / 1024);
        features.push(`${storageGb}GB Storage`);
      }
      
      // Add processing limits
      if (plan.quotas?.maxTranscriptionsMonthly > 0) {
        features.push(`${plan.quotas.maxTranscriptionsMonthly} transcriptions/month`);
      }
      
      if (plan.quotas?.maxVoiceSynthesisMonthly > 0) {
        features.push(`${plan.quotas.maxVoiceSynthesisMonthly} voice synthesis/month`);
      }
      
      // Add file limits
      if (plan.quotas?.maxFilesDaily > 0) {
        features.push(`${plan.quotas.maxFilesDaily} files per day`);
      }
      
      // Add concurrent jobs
      if (plan.quotas?.maxConcurrentJobs > 0) {
        features.push(`${plan.quotas.maxConcurrentJobs} concurrent job${plan.quotas.maxConcurrentJobs > 1 ? 's' : ''}`);
      }
      
      // Add priority support for premium plans
      if (plan.tier === 'premium' || plan.tier === 'enterprise') {
        features.push('Priority Support');
      }
      
      // Add API access
      features.push('API Access');
      
      // Add export capabilities
      if (plan.quotas?.maxExportOperationsMonthly > 0) {
        features.push(`${plan.quotas.maxExportOperationsMonthly} exports/month`);
      }
    }
    
    return features;
  }

  /**
   * Get plan quotas in readable format
   */
  getPlanQuotas(plan: SubscriptionPlan): Record<string, string> {
    const quotas: Record<string, string> = {};
    
    if (plan.quotas) {
      if (plan.quotas.maxStorageMb) {
        quotas['Storage'] = `${Math.round(plan.quotas.maxStorageMb / 1024)} GB`;
      }
      
      if (plan.quotas.maxTranscriptionsMonthly >= 0) {
        quotas['Transcriptions'] = plan.quotas.maxTranscriptionsMonthly === 999999999 
          ? 'Unlimited' 
          : `${plan.quotas.maxTranscriptionsMonthly}/month`;
      }
      
      if (plan.quotas.maxVoiceSynthesisMonthly >= 0) {
        quotas['Voice Synthesis'] = plan.quotas.maxVoiceSynthesisMonthly === 999999999
          ? 'Unlimited'
          : `${plan.quotas.maxVoiceSynthesisMonthly}/month`;
      }
      
      if (plan.quotas.maxConcurrentJobs > 0) {
        quotas['Concurrent Jobs'] = `${plan.quotas.maxConcurrentJobs}`;
      }
    }
    
    return quotas;
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency: string): string {
    const formatters = {
      'AUD': new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('en-EU', { style: 'currency', currency: 'EUR' }),
      'GBP': new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' })
    };
    
    const formatter = formatters[currency as keyof typeof formatters] || 
                     new Intl.NumberFormat('en-US', { style: 'currency', currency });
    
    return formatter.format(amount);
  }

  /**
   * Transform raw plan data to SubscriptionPlan interface
   */
  private transformPlanData(plan: any): SubscriptionPlan {
    return {
      id: plan.id,
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description,
      tier: plan.tier,
      features: plan.features,
      quotas: {
        maxApiCalls: Number(plan.maxApiCalls || 0),
        maxTokens: Number(plan.maxTokens || 0),
        maxStorageMb: Number(plan.maxStorageMb || 0),
        maxProcessingMin: Number(plan.maxProcessingMin || 0),
        maxTranscriptionsMonthly: Number(plan.maxTranscriptionsMonthly || 0),
        maxFilesDaily: Number(plan.maxFilesDaily || 0),
        maxFilesMonthly: Number(plan.maxFilesMonthly || 0),
        maxConcurrentJobs: Number(plan.maxConcurrentJobs || 0),
        maxVoiceSynthesisMonthly: Number(plan.maxVoiceSynthesisMonthly || 0),
        maxExportOperationsMonthly: Number(plan.maxExportOperationsMonthly || 0),
        maxAudioDurationMinutes: Number(plan.maxAudioDurationMinutes || 0),
        priorityLevel: Number(plan.priorityLevel || 0),
      },
      pricing: plan.pricing.map((p: any) => ({
        currency: p.currency,
        price: Number(p.price),
        billingPeriod: p.billingPeriod
      })),
      trialDays: plan.trialDays || 0,
      isActive: plan.isActive
    };
  }
}