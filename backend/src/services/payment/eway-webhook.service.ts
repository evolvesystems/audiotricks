import { PrismaClient } from '@prisma/client';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * eWAY webhook processing service
 * Handles webhook events and payment notifications
 */
export class EwayWebhookService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process incoming eWAY webhook
   */
  async handleWebhook(eventData: any, sourceIp?: string): Promise<void> {
    try {
      logger.info('Processing eWAY webhook', { 
        eventType: eventData.EventType,
        sourceIp 
      });

      // Store webhook event
      await this.storeWebhookEvent(eventData, sourceIp);

      // Process based on event type
      switch (eventData.EventType) {
        case 'Payment.Success':
          await this.handleSuccessfulPayment(eventData);
          break;
        case 'Payment.Failed':
          await this.handleFailedPayment(eventData);
          break;
        case 'Recurring.Payment.Success':
          await this.handleRecurringPaymentSuccess(eventData);
          break;
        case 'Recurring.Payment.Failed':
          await this.handleRecurringPaymentFailed(eventData);
          break;
        case 'TokenCustomer.Created':
          await this.handleTokenCustomerCreated(eventData);
          break;
        case 'TokenCustomer.Updated':
          await this.handleTokenCustomerUpdated(eventData);
          break;
        default:
          logger.warn('Unknown eWAY webhook event type', { eventType: eventData.EventType });
      }

      logger.info('eWAY webhook processed successfully', { 
        eventType: eventData.EventType 
      });
    } catch (error) {
      logger.error('Error processing eWAY webhook:', error);
      throw new Error(`Failed to process webhook: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Handle successful payment webhook
   */
  private async handleSuccessfulPayment(eventData: any): Promise<void> {
    try {
      const { TransactionID, AccessCode } = eventData;

      // Store transaction result
      await this.prisma.ewayTransaction.create({
        data: {
          transactionId: TransactionID,
          accessCode: AccessCode,
          status: 'success',
          amount: eventData.Payment?.TotalAmount || 0,
          currency: eventData.Payment?.CurrencyCode || 'AUD',
          responseCode: eventData.ResponseCode,
          responseMessage: eventData.ResponseMessage,
          transactionData: eventData,
          processedAt: new Date()
        }
      });

      logger.info('Successful payment webhook processed', { 
        transactionId: TransactionID 
      });
    } catch (error) {
      logger.error('Error handling successful payment webhook:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment webhook
   */
  private async handleFailedPayment(eventData: any): Promise<void> {
    try {
      const { TransactionID, AccessCode } = eventData;

      // Store failed transaction
      await this.prisma.ewayTransaction.create({
        data: {
          transactionId: TransactionID || '',
          accessCode: AccessCode || '',
          status: 'failed',
          amount: eventData.Payment?.TotalAmount || 0,
          currency: eventData.Payment?.CurrencyCode || 'AUD',
          responseCode: eventData.ResponseCode,
          responseMessage: eventData.ResponseMessage,
          transactionData: eventData,
          processedAt: new Date()
        }
      });

      logger.info('Failed payment webhook processed', { 
        transactionId: TransactionID 
      });
    } catch (error) {
      logger.error('Error handling failed payment webhook:', error);
      throw error;
    }
  }

  /**
   * Handle recurring payment success
   */
  private async handleRecurringPaymentSuccess(eventData: any): Promise<void> {
    try {
      const { ScheduleID, TransactionID } = eventData;

      // Update recurring schedule
      await this.prisma.ewayRecurringSchedule.updateMany({
        where: { ewayScheduleId: ScheduleID },
        data: {
          lastPaymentDate: new Date(),
          nextPaymentDate: eventData.NextPaymentDate ? new Date(eventData.NextPaymentDate) : null,
          status: 'active',
          updatedAt: new Date()
        }
      });

      // Store transaction
      await this.prisma.ewayTransaction.create({
        data: {
          transactionId: TransactionID,
          scheduleId: ScheduleID,
          status: 'success',
          amount: eventData.Payment?.TotalAmount || 0,
          currency: eventData.Payment?.CurrencyCode || 'AUD',
          responseCode: eventData.ResponseCode,
          responseMessage: eventData.ResponseMessage,
          transactionData: eventData,
          processedAt: new Date()
        }
      });

      logger.info('Recurring payment success webhook processed', { 
        scheduleId: ScheduleID,
        transactionId: TransactionID 
      });
    } catch (error) {
      logger.error('Error handling recurring payment success webhook:', error);
      throw error;
    }
  }

  /**
   * Handle recurring payment failure
   */
  private async handleRecurringPaymentFailed(eventData: any): Promise<void> {
    try {
      const { ScheduleID, TransactionID } = eventData;

      // Update recurring schedule - may need to pause or cancel
      await this.prisma.ewayRecurringSchedule.updateMany({
        where: { ewayScheduleId: ScheduleID },
        data: {
          status: 'failed',
          failureReason: eventData.ResponseMessage,
          updatedAt: new Date()
        }
      });

      // Store failed transaction
      await this.prisma.ewayTransaction.create({
        data: {
          transactionId: TransactionID || '',
          scheduleId: ScheduleID,
          status: 'failed',
          amount: eventData.Payment?.TotalAmount || 0,
          currency: eventData.Payment?.CurrencyCode || 'AUD',
          responseCode: eventData.ResponseCode,
          responseMessage: eventData.ResponseMessage,
          transactionData: eventData,
          processedAt: new Date()
        }
      });

      logger.warn('Recurring payment failed', { 
        scheduleId: ScheduleID,
        reason: eventData.ResponseMessage 
      });
    } catch (error) {
      logger.error('Error handling recurring payment failure webhook:', error);
      throw error;
    }
  }

  /**
   * Handle token customer created webhook
   */
  private async handleTokenCustomerCreated(eventData: any): Promise<void> {
    try {
      const { TokenCustomerID, AccessCode } = eventData;

      // Update customer record
      await this.prisma.ewayCustomer.updateMany({
        where: { accessCode: AccessCode },
        data: {
          ewayCustomerToken: TokenCustomerID,
          isActive: true,
          updatedAt: new Date()
        }
      });

      logger.info('Token customer created webhook processed', { 
        tokenCustomerId: TokenCustomerID 
      });
    } catch (error) {
      logger.error('Error handling token customer created webhook:', error);
      throw error;
    }
  }

  /**
   * Handle token customer updated webhook
   */
  private async handleTokenCustomerUpdated(eventData: any): Promise<void> {
    try {
      const { TokenCustomerID } = eventData;

      // Update customer record
      await this.prisma.ewayCustomer.updateMany({
        where: { ewayCustomerToken: TokenCustomerID },
        data: {
          customerData: eventData.Customer,
          updatedAt: new Date()
        }
      });

      logger.info('Token customer updated webhook processed', { 
        tokenCustomerId: TokenCustomerID 
      });
    } catch (error) {
      logger.error('Error handling token customer updated webhook:', error);
      throw error;
    }
  }

  /**
   * Store webhook event for auditing
   */
  private async storeWebhookEvent(eventData: any, sourceIp?: string): Promise<void> {
    try {
      await this.prisma.ewayWebhookEvent.create({
        data: {
          eventType: eventData.EventType || 'unknown',
          eventData: eventData,
          sourceIp: sourceIp || '',
          processedAt: new Date(),
          status: 'received'
        }
      });
    } catch (error) {
      logger.error('Error storing webhook event:', error);
      // Don't throw here - webhook storage failure shouldn't fail processing
    }
  }
}