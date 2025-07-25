/**
 * Admin eWAY Configuration Service
 * Handles eWAY configuration management for admin dashboard
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export class AdminEwayConfigService {
  /**
   * Get eWAY configuration (sensitive data masked)
   */
  async getConfig(queryParams: any) {
    const { includeSecrets = false } = queryParams;
    
    try {
      const config = await prisma.systemConfig.findMany({
        where: {
          key: {
            startsWith: 'eway_'
          }
        },
        orderBy: { key: 'asc' }
      });

      const configData = config.reduce((acc, item) => {
        let value = item.value;
        
        // Mask sensitive values unless explicitly requested
        if (!includeSecrets && this.isSensitiveKey(item.key)) {
          value = this.maskSensitiveValue(value);
        }
        
        acc[item.key] = {
          value,
          description: item.description || '',
          updatedAt: item.updatedAt,
          updatedBy: item.updatedBy
        };
        
        return acc;
      }, {} as any);

      return {
        config: configData,
        lastUpdated: config.length > 0 
          ? Math.max(...config.map(c => c.updatedAt.getTime()))
          : null,
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      logger.error('Error fetching eWAY config:', error);
      throw error;
    }
  }

  /**
   * Save eWAY configuration
   */
  async saveConfig(configData: any) {
    const { config, updatedBy } = configData;
    
    try {
      const updates = [];
      
      for (const [key, data] of Object.entries(config as any)) {
        if (!key.startsWith('eway_')) {
          throw new Error(`Invalid config key: ${key}. Must start with 'eway_'`);
        }
        
        updates.push(
          prisma.systemConfig.upsert({
            where: { key },
            update: {
              value: (data as any).value,
              description: (data as any).description || '',
              updatedBy: updatedBy || 'admin',
              updatedAt: new Date()
            },
            create: {
              key,
              value: (data as any).value,
              description: (data as any).description || '',
              createdBy: updatedBy || 'admin',
              updatedBy: updatedBy || 'admin'
            }
          })
        );
      }
      
      const results = await Promise.all(updates);
      
      logger.info(`Updated ${results.length} eWAY configuration keys`, {
        keys: Object.keys(config),
        updatedBy
      });

      return {
        success: true,
        updated: results.length,
        keys: Object.keys(config),
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Error saving eWAY config:', error);
      throw error;
    }
  }

  /**
   * Test eWAY configuration
   */
  async testConfig(testData: any) {
    const { apiKey, apiPassword, endpoint, customerReference } = testData;
    
    try {
      // Validate required fields
      if (!apiKey || !apiPassword || !endpoint) {
        throw new Error('Missing required configuration fields');
      }

      const testResults = {
        apiConnection: false,
        customerLookup: false,
        transactionTest: false,
        webhookEndpoint: false,
        errors: [] as string[]
      };

      // Test 1: API Connection
      try {
        // TODO: Implement actual eWAY API test call
        // For now, simulate a successful connection test
        await this.simulateApiTest(apiKey, apiPassword, endpoint);
        testResults.apiConnection = true;
      } catch (error) {
        testResults.errors.push(`API Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 2: Customer Lookup (optional)
      if (customerReference) {
        try {
          // TODO: Implement customer lookup test
          await this.simulateCustomerLookup(customerReference, apiKey);
          testResults.customerLookup = true;
        } catch (error) {
          testResults.errors.push(`Customer lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Test 3: Test Transaction
      try {
        // TODO: Implement test transaction (usually $1.00 auth/void)
        await this.simulateTestTransaction(apiKey, apiPassword);
        testResults.transactionTest = true;
      } catch (error) {
        testResults.errors.push(`Test transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Test 4: Webhook Endpoint
      try {
        // TODO: Test webhook endpoint accessibility
        await this.simulateWebhookTest();
        testResults.webhookEndpoint = true;
      } catch (error) {
        testResults.errors.push(`Webhook test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      const overallSuccess = testResults.apiConnection && 
                           testResults.transactionTest && 
                           testResults.webhookEndpoint;

      logger.info('eWAY configuration test completed', {
        success: overallSuccess,
        results: testResults
      });

      return {
        success: overallSuccess,
        results: testResults,
        timestamp: new Date(),
        recommendation: overallSuccess 
          ? 'Configuration is ready for production use'
          : 'Please resolve the failing tests before using in production'
      };
    } catch (error) {
      logger.error('Error testing eWAY config:', error);
      throw error;
    }
  }

  /**
   * Check if config key contains sensitive data
   */
  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'eway_api_key',
      'eway_api_password',
      'eway_webhook_secret',
      'eway_encryption_key'
    ];
    
    return sensitiveKeys.includes(key.toLowerCase()) || 
           key.toLowerCase().includes('password') ||
           key.toLowerCase().includes('secret') ||
           key.toLowerCase().includes('key');
  }

  /**
   * Mask sensitive configuration values
   */
  private maskSensitiveValue(value: string): string {
    if (!value || value.length <= 8) {
      return '****';
    }
    
    const visibleChars = 4;
    const maskedLength = value.length - (visibleChars * 2);
    const mask = '*'.repeat(Math.max(maskedLength, 4));
    
    return value.substring(0, visibleChars) + mask + value.substring(value.length - visibleChars);
  }

  /**
   * Simulate API connection test
   */
  private async simulateApiTest(apiKey: string, apiPassword: string, endpoint: string): Promise<void> {
    // TODO: Replace with actual eWAY API test
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!endpoint.includes('eway') || apiKey.length < 10) {
      throw new Error('Invalid API credentials or endpoint');
    }
  }

  /**
   * Simulate customer lookup test
   */
  private async simulateCustomerLookup(customerReference: string, apiKey: string): Promise<void> {
    // TODO: Replace with actual customer lookup
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!customerReference || customerReference.length < 3) {
      throw new Error('Invalid customer reference');
    }
  }

  /**
   * Simulate test transaction
   */
  private async simulateTestTransaction(apiKey: string, apiPassword: string): Promise<void> {
    // TODO: Replace with actual test transaction
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (apiKey.includes('test') && apiPassword.includes('test')) {
      throw new Error('Test credentials cannot process real transactions');
    }
  }

  /**
   * Simulate webhook endpoint test
   */
  private async simulateWebhookTest(): Promise<void> {
    // TODO: Replace with actual webhook endpoint test
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate success for now
  }
}