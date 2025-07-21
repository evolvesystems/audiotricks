import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';
import fetch from 'node-fetch';

/**
 * Low-level eWAY API communication service
 * Handles authentication, requests, and API responses
 */
export class EwayApiService {
  private apiKey: string;
  private password: string;
  private endpoint: string;
  private isProduction: boolean;

  constructor() {
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

      const requestBody = {
        Customer: {
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
        ShippingAddress: customerDetails.shippingAddress || {},
        Items: payment.items || [],
        Options: payment.options || [],
        Payment: {
          TotalAmount: Math.round(payment.totalAmount * 100), // Convert to cents
          InvoiceNumber: payment.invoiceNumber || '',
          InvoiceDescription: payment.invoiceDescription || '',
          InvoiceReference: payment.invoiceReference || '',
          CurrencyCode: payment.currencyCode || 'AUD'
        },
        RedirectUrl: redirectUrl,
        Method: method,
        TransactionType: transactionType,
        CancelUrl: payment.cancelUrl || redirectUrl,
        CustomerIP: customerDetails.customerIP || ''
      };

      const response = await this.makeApiRequest('/CreateAccessCode', 'POST', requestBody);

      if (!response.Errors || response.Errors.length === 0) {
        logger.info('eWAY access code created successfully', { 
          accessCode: response.AccessCode,
          method,
          transactionType
        });
        return response;
      } else {
        throw new Error(`eWAY API error: ${response.Errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error creating eWAY access code:', error);
      throw new Error(`Failed to create access code: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get transaction result using access code
   */
  async getTransactionResult(accessCode: string): Promise<any> {
    try {
      const response = await this.makeApiRequest(`/GetAccessCodeResult/${accessCode}`, 'GET');

      if (!response.Errors || response.Errors.length === 0) {
        logger.info('eWAY transaction result retrieved', { 
          accessCode,
          transactionID: response.TransactionID,
          responseCode: response.ResponseCode
        });
        return response;
      } else {
        throw new Error(`eWAY API error: ${response.Errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error getting eWAY transaction result:', error);
      throw new Error(`Failed to get transaction result: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Create recurring payment schedule
   */
  async createRecurringSchedule(params: {
    tokenCustomerId: string;
    amount: number;
    currency: string;
    frequency: 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Yearly';
    startDate: Date;
    endDate?: Date;
    invoiceDescription: string;
  }): Promise<any> {
    try {
      const requestBody = {
        TokenCustomer: {
          TokenCustomerID: params.tokenCustomerId
        },
        Payment: {
          TotalAmount: Math.round(params.amount * 100),
          CurrencyCode: params.currency,
          InvoiceDescription: params.invoiceDescription
        },
        Schedule: {
          StartDate: params.startDate.toISOString().split('T')[0],
          EndDate: params.endDate ? params.endDate.toISOString().split('T')[0] : null,
          Frequency: params.frequency,
          NextPaymentDate: params.startDate.toISOString().split('T')[0]
        }
      };

      const response = await this.makeApiRequest('/Recurring/Create', 'POST', requestBody);

      if (!response.Errors || response.Errors.length === 0) {
        logger.info('eWAY recurring schedule created', { 
          scheduleId: response.ScheduleID,
          tokenCustomerId: params.tokenCustomerId
        });
        return response;
      } else {
        throw new Error(`eWAY API error: ${response.Errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error creating eWAY recurring schedule:', error);
      throw new Error(`Failed to create recurring schedule: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Cancel recurring payment schedule
   */
  async cancelRecurringSchedule(scheduleId: string): Promise<any> {
    try {
      const response = await this.makeApiRequest(`/Recurring/Cancel/${scheduleId}`, 'POST');

      if (!response.Errors || response.Errors.length === 0) {
        logger.info('eWAY recurring schedule cancelled', { scheduleId });
        return response;
      } else {
        throw new Error(`eWAY API error: ${response.Errors.join(', ')}`);
      }
    } catch (error) {
      logger.error('Error cancelling eWAY recurring schedule:', error);
      throw new Error(`Failed to cancel recurring schedule: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Make authenticated API request to eWAY
   */
  async makeApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<any> {
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

      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      logger.debug('Making eWAY API request', { method, endpoint });

      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      logger.error('eWAY API request failed:', error);
      throw new Error(`API request failed: ${getErrorMessage(error)}`);
    }
  }
}