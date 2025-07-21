import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import fetch from 'node-fetch';

/**
 * eWAY Rapid API v3 service for Australian payment processing
 * Supports one-time payments, recurring subscriptions, and token customer management
 */
export class EwayService {
  private prisma: PrismaClient;
  private apiKey: string;
  private password: string;
  private endpoint: string;
  private isProduction: boolean;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    this.apiKey = process.env.EWAY_API_KEY || '';
    this.password = process.env.EWAY_PASSWORD || '';
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Set endpoint based on environment
    this.endpoint = this.isProduction 
      ? 'https://api.ewaypayments.com'
      : 'https://api.sandbox.ewaypayments.com';

    if (!this.apiKey || !this.password) {
      throw new Error('eWAY API credentials not configured');
    }
  }

  /**
   * Create eWAY access code for secure payment processing
   */
  async createAccessCode(paymentData: {
    customerDetails: any;
    payment: {
      totalAmount: number;
      currencyCode?: string;
      invoiceNumber?: string;
      invoiceDescription?: string;
    };
    redirectUrl: string;
    method: 'ProcessPayment' | 'CreateTokenCustomer' | 'UpdateTokenCustomer';
    transactionType: 'Purchase' | 'Recurring';
  }): Promise<any> {
    try {
      const { customerDetails, payment, redirectUrl, method, transactionType } = paymentData;

      const requestData = {
        Customer: {
          TokenCustomerID: customerDetails.tokenCustomerID || null,
          Reference: customerDetails.reference || '',
          Title: customerDetails.title || '',
          FirstName: customerDetails.firstName || '',
          LastName: customerDetails.lastName || '',
          CompanyName: customerDetails.companyName || '',
          JobDescription: customerDetails.jobDescription || '',
          Street1: customerDetails.street1 || '',
          Street2: customerDetails.street2 || '',
          City: customerDetails.city || '',
          State: customerDetails.state || '',
          PostalCode: customerDetails.postalCode || '',
          Country: customerDetails.country || 'AU',
          Email: customerDetails.email || '',
          Phone: customerDetails.phone || '',
          Mobile: customerDetails.mobile || '',
          Comments: customerDetails.comments || '',
          Fax: customerDetails.fax || '',
          Url: customerDetails.url || ''
        },
        ShippingAddress: {
          FirstName: customerDetails.shippingFirstName || customerDetails.firstName || '',
          LastName: customerDetails.shippingLastName || customerDetails.lastName || '',
          Street1: customerDetails.shippingStreet1 || customerDetails.street1 || '',
          Street2: customerDetails.shippingStreet2 || customerDetails.street2 || '',
          City: customerDetails.shippingCity || customerDetails.city || '',
          State: customerDetails.shippingState || customerDetails.state || '',
          Country: customerDetails.shippingCountry || customerDetails.country || 'AU',
          PostalCode: customerDetails.shippingPostalCode || customerDetails.postalCode || '',
          Email: customerDetails.shippingEmail || customerDetails.email || '',
          Phone: customerDetails.shippingPhone || customerDetails.phone || ''
        },
        Items: [{
          SKU: 'AudioTricks-Subscription',
          Description: payment.invoiceDescription || 'AudioTricks Subscription',
          Quantity: 1,
          UnitCost: payment.totalAmount,
          Tax: 0,
          Total: payment.totalAmount
        }],
        Payment: {
          TotalAmount: payment.totalAmount,
          InvoiceNumber: payment.invoiceNumber || '',
          InvoiceDescription: payment.invoiceDescription || 'AudioTricks Payment',
          InvoiceReference: payment.invoiceNumber || '',
          CurrencyCode: payment.currencyCode || 'AUD'
        },
        RedirectUrl: redirectUrl,
        Method: method,
        TransactionType: transactionType,
        DeviceID: customerDetails.deviceID || '',
        PartnerID: process.env.EWAY_PARTNER_ID || ''
      };

      const response = await this.makeApiRequest('/AccessCodes', 'POST', requestData);
      
      if (!response.success) {
        throw new Error(`eWAY API Error: ${response.errors?.join(', ') || 'Unknown error'}`);
      }

      return {
        accessCode: response.AccessCode,
        formActionURL: response.FormActionURL,
        completeCheckoutURL: response.CompleteCheckoutURL,
        customer: response.Customer
      };
    } catch (error) {
      logger.error('Failed to create eWAY access code:', error);
      throw new Error(`Failed to create access code: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get transaction result after payment completion
   */
  async getTransactionResult(accessCode: string): Promise<any> {
    try {
      const response = await this.makeApiRequest(`/AccessCode/${accessCode}`, 'GET');
      
      if (!response.success) {
        throw new Error(`eWAY API Error: ${response.errors?.join(', ') || 'Unknown error'}`);
      }

      // Store transaction result in database
      await this.storeTransactionResult(response);

      return {
        transactionID: response.TransactionID,
        transactionStatus: response.TransactionStatus,
        responseCode: response.ResponseCode,
        responseMessage: response.ResponseMessage,
        authCode: response.AuthorisationCode,
        customer: response.Customer,
        payment: response.Payment,
        fraudAction: response.FraudAction,
        tokenCustomerID: response.TokenCustomerID
      };
    } catch (error) {
      logger.error('Failed to get transaction result:', error);
      throw new Error(`Failed to get transaction result: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create token customer for recurring payments
   */
  async createTokenCustomer(customerData: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    country?: string;
    street1?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    phone?: string;
    reference?: string;
  }): Promise<string> {
    try {
      const requestData = {
        Customer: {
          FirstName: customerData.firstName,
          LastName: customerData.lastName,
          Email: customerData.email,
          CompanyName: customerData.companyName || '',
          Country: customerData.country || 'AU',
          Street1: customerData.street1 || '',
          City: customerData.city || '',
          State: customerData.state || '',
          PostalCode: customerData.postalCode || '',
          Phone: customerData.phone || '',
          Reference: customerData.reference || customerData.userId
        }
      };

      const response = await this.makeApiRequest('/Customer', 'POST', requestData);
      
      if (!response.success) {
        throw new Error(`eWAY API Error: ${response.errors?.join(', ') || 'Unknown error'}`);
      }

      // Store customer in database
      await this.prisma.ewayCustomer.create({
        data: {
          userId: customerData.userId,
          ewayCustomerToken: response.TokenCustomerID,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          companyName: customerData.companyName,
          country: customerData.country || 'AU',
          streetAddress: customerData.street1,
          city: customerData.city,
          state: customerData.state,
          postalCode: customerData.postalCode,
          ewayReference: customerData.reference || customerData.userId,
          isActive: true
        }
      });

      logger.info(`Created eWAY token customer ${response.TokenCustomerID} for user ${customerData.userId}`);
      return response.TokenCustomerID;
    } catch (error) {
      logger.error('Failed to create token customer:', error);
      throw new Error(`Failed to create token customer: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Process recurring payment using token customer
   */
  async processRecurringPayment(params: {
    userId: string;
    subscriptionId: string;
    amount: number;
    currency?: string;
    invoiceNumber?: string;
    description?: string;
    workspaceId?: string;
  }): Promise<any> {
    try {
      const { userId, subscriptionId, amount, currency = 'AUD', invoiceNumber, description, workspaceId } = params;

      // Get token customer
      const customer = await this.prisma.ewayCustomer.findFirst({
        where: {
          userId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' }
      });

      if (!customer) {
        throw new Error('No active eWAY customer found for user');
      }

      // Create transaction record
      const transaction = await this.prisma.ewayTransaction.create({
        data: {
          userId,
          workspaceId,
          ewayCustomerId: customer.id,
          subscriptionId,
          transactionType: 'recurring',
          amount,
          currency,
          transactionStatus: 'pending',
          isRecurring: true,
          ewayInvoiceNumber: invoiceNumber,
          ewayInvoiceReference: invoiceNumber
        }
      });

      // Process payment via eWAY
      const requestData = {
        Customer: {
          TokenCustomerID: customer.ewayCustomerToken
        },
        Payment: {
          TotalAmount: Math.round(amount * 100), // Convert to cents
          InvoiceNumber: invoiceNumber || transaction.id,
          InvoiceDescription: description || 'AudioTricks Subscription Payment',
          CurrencyCode: currency
        },
        TransactionType: 'Recurring'
      };

      const response = await this.makeApiRequest('/Transaction', 'POST', requestData);
      
      // Update transaction with result
      await this.prisma.ewayTransaction.update({
        where: { id: transaction.id },
        data: {
          ewayTransactionId: response.TransactionID,
          ewayAuthCode: response.AuthorisationCode,
          responseCode: response.ResponseCode,
          responseMessage: response.ResponseMessage,
          transactionStatus: response.TransactionStatus ? 'approved' : 'declined',
          fraudAction: response.FraudAction,
          verificationStatus: response.VerificationStatus,
          beagleScore: response.BeagleScore ? parseFloat(response.BeagleScore) : null,
          processedAt: new Date(),
          ewayRawResponse: response,
          errorCode: response.Errors?.[0]?.split(' ')[0],
          errorMessage: response.Errors?.join(', ')
        }
      });

      return {
        transactionId: transaction.id,
        ewayTransactionId: response.TransactionID,
        success: !!response.TransactionStatus,
        responseCode: response.ResponseCode,
        responseMessage: response.ResponseMessage,
        authCode: response.AuthorisationCode
      };
    } catch (error) {
      logger.error('Failed to process recurring payment:', error);
      throw new Error(`Failed to process recurring payment: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create recurring billing schedule
   */
  async createRecurringSchedule(params: {
    userId: string;
    subscriptionId: string;
    amount: number;
    scheduleType: 'monthly' | 'yearly';
    startDate?: Date;
    workspaceId?: string;
    currency?: string;
  }): Promise<string> {
    try {
      const { userId, subscriptionId, amount, scheduleType, startDate = new Date(), workspaceId, currency = 'AUD' } = params;

      // Get token customer
      const customer = await this.prisma.ewayCustomer.findFirst({
        where: {
          userId,
          isActive: true
        }
      });

      if (!customer) {
        throw new Error('No active eWAY customer found for user');
      }

      // Calculate next billing date
      const nextBilling = new Date(startDate);
      if (scheduleType === 'monthly') {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      } else {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      }

      // Create recurring schedule
      const schedule = await this.prisma.ewayRecurringSchedule.create({
        data: {
          userId,
          workspaceId,
          ewayCustomerId: customer.id,
          subscriptionId,
          scheduleType,
          billingAmount: amount,
          currency,
          startDate,
          nextBillingDate: nextBilling,
          status: 'active'
        }
      });

      logger.info(`Created recurring schedule ${schedule.id} for user ${userId}`);
      return schedule.id;
    } catch (error) {
      logger.error('Failed to create recurring schedule:', error);
      throw new Error(`Failed to create recurring schedule: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Process due recurring payments (called by scheduled job)
   */
  async processDueRecurringPayments(): Promise<number> {
    try {
      const dueSchedules = await this.prisma.ewayRecurringSchedule.findMany({
        where: {
          status: 'active',
          nextBillingDate: {
            lte: new Date()
          },
          failedAttempts: {
            lt: 3 // Max failed attempts
          }
        },
        include: {
          ewayCustomer: true,
          user: true
        }
      });

      let processedCount = 0;

      for (const schedule of dueSchedules) {
        try {
          const result = await this.processRecurringPayment({
            userId: schedule.userId,
            subscriptionId: schedule.subscriptionId,
            amount: Number(schedule.billingAmount),
            currency: schedule.currency,
            invoiceNumber: `REC-${schedule.id}-${Date.now()}`,
            description: `AudioTricks ${schedule.scheduleType} subscription`,
            workspaceId: schedule.workspaceId
          });

          if (result.success) {
            // Update schedule for next billing
            const nextBilling = new Date(schedule.nextBillingDate);
            if (schedule.scheduleType === 'monthly') {
              nextBilling.setMonth(nextBilling.getMonth() + 1);
            } else {
              nextBilling.setFullYear(nextBilling.getFullYear() + 1);
            }

            await this.prisma.ewayRecurringSchedule.update({
              where: { id: schedule.id },
              data: {
                nextBillingDate: nextBilling,
                lastProcessedAt: new Date(),
                lastTransactionId: result.transactionId,
                failedAttempts: 0 // Reset failed attempts on success
              }
            });

            processedCount++;
          } else {
            // Handle failed payment
            await this.prisma.ewayRecurringSchedule.update({
              where: { id: schedule.id },
              data: {
                failedAttempts: schedule.failedAttempts + 1,
                lastProcessedAt: new Date()
              }
            });

            logger.warn(`Recurring payment failed for schedule ${schedule.id}: ${result.responseMessage}`);
          }
        } catch (error) {
          logger.error(`Error processing recurring payment for schedule ${schedule.id}:`, error);
          
          // Increment failed attempts
          await this.prisma.ewayRecurringSchedule.update({
            where: { id: schedule.id },
            data: {
              failedAttempts: schedule.failedAttempts + 1
            }
          });
        }
      }

      logger.info(`Processed ${processedCount} recurring payments`);
      return processedCount;
    } catch (error) {
      logger.error('Failed to process due recurring payments:', error);
      throw new Error(`Failed to process recurring payments: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel recurring schedule
   */
  async cancelRecurringSchedule(scheduleId: string, reason?: string): Promise<void> {
    try {
      await this.prisma.ewayRecurringSchedule.update({
        where: { id: scheduleId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          metadata: {
            cancelReason: reason
          }
        }
      });

      logger.info(`Cancelled recurring schedule ${scheduleId}`);
    } catch (error) {
      logger.error('Failed to cancel recurring schedule:', error);
      throw new Error(`Failed to cancel recurring schedule: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Store transaction result in database
   */
  private async storeTransactionResult(result: any): Promise<void> {
    try {
      // Find existing transaction by access code or create new one
      let transaction = await this.prisma.ewayTransaction.findFirst({
        where: { ewayAccessCode: result.AccessCode }
      });

      if (transaction) {
        // Update existing transaction
        await this.prisma.ewayTransaction.update({
          where: { id: transaction.id },
          data: {
            ewayTransactionId: result.TransactionID,
            ewayAuthCode: result.AuthorisationCode,
            responseCode: result.ResponseCode,
            responseMessage: result.ResponseMessage,
            transactionStatus: result.TransactionStatus ? 'approved' : 'declined',
            fraudAction: result.FraudAction,
            verificationStatus: result.VerificationStatus,
            beagleScore: result.BeagleScore ? parseFloat(result.BeagleScore) : null,
            processedAt: new Date(),
            ewayRawResponse: result
          }
        });

        // Update customer card details if available
        if (result.Customer && result.Customer.CardDetails) {
          const cardDetails = result.Customer.CardDetails;
          await this.prisma.ewayCustomer.updateMany({
            where: { ewayCustomerToken: result.TokenCustomerID },
            data: {
              cardLastFour: cardDetails.Number ? cardDetails.Number.slice(-4) : null,
              cardType: cardDetails.Type,
              cardExpiryMonth: cardDetails.ExpiryMonth ? parseInt(cardDetails.ExpiryMonth) : null,
              cardExpiryYear: cardDetails.ExpiryYear ? parseInt(cardDetails.ExpiryYear) : null,
              lastUsedAt: new Date()
            }
          });
        }
      }
    } catch (error) {
      logger.error('Failed to store transaction result:', error);
      // Don't throw error to avoid breaking payment flow
    }
  }

  /**
   * Make authenticated API request to eWAY
   */
  private async makeApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
    try {
      const url = `${this.endpoint}${endpoint}`;
      const auth = Buffer.from(`${this.apiKey}:${this.password}`).toString('base64');

      const options: any = {
        method,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AudioTricks/1.0'
        }
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        logger.error(`eWAY API error: ${response.status} ${response.statusText}`, responseData);
        throw new Error(`eWAY API error: ${response.status} ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      logger.error('eWAY API request failed:', error);
      throw error;
    }
  }

  /**
   * Process webhook event from eWAY
   */
  async processWebhook(eventData: any, sourceIp?: string): Promise<void> {
    try {
      // Store webhook event
      const webhook = await this.prisma.ewayWebhookEvent.create({
        data: {
          eventType: eventData.EventType || 'unknown',
          ewayTransactionId: eventData.TransactionID ? parseInt(eventData.TransactionID) : null,
          ewayCustomerToken: eventData.TokenCustomerID,
          eventData: eventData,
          rawPayload: JSON.stringify(eventData),
          sourceIp: sourceIp
        }
      });

      // Process specific event types
      switch (eventData.EventType) {
        case 'Payment.Successful':
          await this.handleSuccessfulPayment(eventData);
          break;
        case 'Payment.Failed':
          await this.handleFailedPayment(eventData);
          break;
        case 'Customer.Updated':
          await this.handleCustomerUpdate(eventData);
          break;
        default:
          logger.info(`Received unknown webhook event type: ${eventData.EventType}`);
      }

      // Mark webhook as processed
      await this.prisma.ewayWebhookEvent.update({
        where: { id: webhook.id },
        data: {
          processed: true,
          processedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to process eWAY webhook:', error);
      throw error;
    }
  }

  private async handleSuccessfulPayment(eventData: any): Promise<void> {
    // Implementation for successful payment webhook
    logger.info(`Payment successful: ${eventData.TransactionID}`);
  }

  private async handleFailedPayment(eventData: any): Promise<void> {
    // Implementation for failed payment webhook
    logger.warn(`Payment failed: ${eventData.TransactionID}`);
  }

  private async handleCustomerUpdate(eventData: any): Promise<void> {
    // Implementation for customer update webhook
    logger.info(`Customer updated: ${eventData.TokenCustomerID}`);
  }
}