import { PrismaClient } from '@prisma/client';
import { EwayApiService } from './eway-api.service';
import { getErrorMessage } from '../../utils/error-handler';
import { logger } from '../../utils/logger';

/**
 * eWAY token customer management service
 * Handles customer creation, updates, and token management
 */
export class EwayCustomerService {
  private prisma: PrismaClient;
  private ewayApi: EwayApiService;

  constructor() {
    this.prisma = new PrismaClient();
    this.ewayApi = new EwayApiService();
  }

  /**
   * Create eWAY token customer
   */
  async createTokenCustomer(customerData: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
    reference: string;
    phone?: string;
    address?: {
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }): Promise<string> {
    try {
      logger.info('Creating eWAY token customer', { 
        userId: customerData.userId,
        email: customerData.email 
      });

      const accessCodeData = await this.ewayApi.createAccessCode({
        customerDetails: {
          reference: customerData.reference,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          companyName: customerData.companyName || '',
          phone: customerData.phone || '',
          street1: customerData.address?.street1 || '',
          street2: customerData.address?.street2 || '',
          city: customerData.address?.city || '',
          state: customerData.address?.state || '',
          postalCode: customerData.address?.postalCode || '',
          country: customerData.address?.country || 'AU'
        },
        payment: {
          totalAmount: 0, // No charge for token customer creation
          currencyCode: 'AUD',
          invoiceDescription: 'Token Customer Creation'
        },
        redirectUrl: `${process.env.FRONTEND_URL}/billing/setup-complete`,
        method: 'CreateTokenCustomer',
        transactionType: 'Purchase'
      });

      if (!accessCodeData.AccessCode) {
        throw new Error('Failed to create access code for token customer');
      }

      // Store customer record in database
      const ewayCustomer = await this.prisma.ewayCustomer.create({
        data: {
          userId: customerData.userId,
          ewayCustomerToken: '', // Will be updated after successful creation
          accessCode: accessCodeData.AccessCode,
          isActive: false, // Will be activated after successful creation
          customerData: {
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            email: customerData.email,
            companyName: customerData.companyName,
            reference: customerData.reference,
            phone: customerData.phone,
            address: customerData.address
          },
          createdAt: new Date()
        }
      });

      logger.info('eWAY token customer record created', { 
        customerId: ewayCustomer.id,
        accessCode: accessCodeData.AccessCode 
      });

      return accessCodeData.AccessCode;
    } catch (error) {
      logger.error('Error creating eWAY token customer:', error);
      throw new Error(`Failed to create token customer: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Complete token customer creation after successful payment flow
   */
  async completeTokenCustomerCreation(accessCode: string): Promise<string> {
    try {
      const result = await this.ewayApi.getTransactionResult(accessCode);

      if (result.ResponseCode !== '00') {
        throw new Error(`Token customer creation failed: ${result.ResponseMessage}`);
      }

      const tokenCustomerId = result.TokenCustomerID;
      if (!tokenCustomerId) {
        throw new Error('No token customer ID returned from eWAY');
      }

      // Update customer record with token
      await this.prisma.ewayCustomer.updateMany({
        where: { accessCode },
        data: {
          ewayCustomerToken: tokenCustomerId,
          isActive: true,
          transactionData: result,
          updatedAt: new Date()
        }
      });

      logger.info('eWAY token customer creation completed', { 
        tokenCustomerId,
        accessCode 
      });

      return tokenCustomerId;
    } catch (error) {
      logger.error('Error completing token customer creation:', error);
      throw new Error(`Failed to complete token customer creation: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get customer by user ID
   */
  async getCustomerByUserId(userId: string): Promise<any | null> {
    try {
      const customer = await this.prisma.ewayCustomer.findFirst({
        where: { 
          userId,
          isActive: true 
        },
        orderBy: { createdAt: 'desc' }
      });

      return customer;
    } catch (error) {
      logger.error('Error getting eWAY customer:', error);
      throw new Error(`Failed to get customer: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get payment methods for workspace
   */
  async getPaymentMethods(workspaceId: string): Promise<any[]> {
    try {
      // Get workspace users
      const workspaceUsers = await this.prisma.workspaceUser.findMany({
        where: { workspaceId },
        include: { 
          user: {
            include: {
              ewayCustomers: {
                where: { isActive: true }
              }
            }
          }
        }
      });

      const paymentMethods: any[] = [];

      for (const workspaceUser of workspaceUsers) {
        for (const customer of workspaceUser.user.ewayCustomers) {
          // For eWAY, we typically store card details securely with the token
          // This is a simplified representation
          paymentMethods.push({
            id: customer.ewayCustomerToken,
            type: 'card',
            last4: '****', // Would come from stored customer data
            brand: 'unknown', // Would come from stored customer data
            expiryMonth: null,
            expiryYear: null,
            isDefault: customer.isActive,
            customerId: customer.ewayCustomerToken
          });
        }
      }

      return paymentMethods;
    } catch (error) {
      logger.error('Error getting eWAY payment methods:', error);
      throw new Error(`Failed to get payment methods: ${getErrorMessage(error)}`);
    }
  }
}