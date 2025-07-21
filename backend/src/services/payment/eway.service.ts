import { EwayApiService } from './eway-api.service';
import { EwayCustomerService } from './eway-customer.service';
import { EwayWebhookService } from './eway-webhook.service';

/**
 * Main eWAY service that orchestrates API, customer, and webhook services
 * This is the public API that controllers and other services should use
 */
export class EwayService {
  private apiService: EwayApiService;
  private customerService: EwayCustomerService;
  private webhookService: EwayWebhookService;

  constructor() {
    this.apiService = new EwayApiService();
    this.customerService = new EwayCustomerService();
    this.webhookService = new EwayWebhookService();
  }

  // Customer Management
  async createTokenCustomer(customerData: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    reference: string;
    phone?: string;
    address?: any;
  }): Promise<string> {
    return this.customerService.createTokenCustomer(customerData);
  }

  async completeTokenCustomerCreation(accessCode: string): Promise<string> {
    return this.customerService.completeTokenCustomerCreation(accessCode);
  }

  async getCustomerByUserId(userId: string): Promise<any | null> {
    return this.customerService.getCustomerByUserId(userId);
  }

  async getPaymentMethods(workspaceId: string): Promise<any[]> {
    return this.customerService.getPaymentMethods(workspaceId);
  }

  // Payment Processing
  async createAccessCode(paymentData: any): Promise<any> {
    return this.apiService.createAccessCode(paymentData);
  }

  async getTransactionResult(accessCode: string): Promise<any> {
    return this.apiService.getTransactionResult(accessCode);
  }

  // Recurring Payments
  async createRecurringSchedule(params: {
    tokenCustomerId: string;
    amount: number;
    currency: string;
    frequency: 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Yearly';
    startDate: Date;
    endDate?: Date;
    invoiceDescription: string;
  }): Promise<any> {
    return this.apiService.createRecurringSchedule(params);
  }

  async cancelRecurringSchedule(scheduleId: string): Promise<any> {
    return this.apiService.cancelRecurringSchedule(scheduleId);
  }

  // Webhook Processing
  async handleWebhook(eventData: any, sourceIp?: string): Promise<void> {
    return this.webhookService.handleWebhook(eventData, sourceIp);
  }

  // Legacy method compatibility
  async processRecurringPayment(params: any): Promise<any> {
    // This method would contain recurring payment logic
    // For now, delegating to createRecurringSchedule
    return this.createRecurringSchedule(params);
  }

  async processDueRecurringPayments(): Promise<number> {
    // This would contain logic to process due payments
    // Implementation would depend on specific business requirements
    return 0;
  }
}