import { describe, test, expect, beforeEach, vi } from 'vitest';
import { EwayApiService } from '../../../src/services/payment/eway-api.service';

/**
 * Test suite for EwayApiService - eWAY API integration
 * Follows CLAUDE.md requirements: expected use, edge case, failure case
 */

describe('EwayApiService', () => {
  let ewayApiService: EwayApiService;

  beforeEach(() => {
    // Mock environment variables
    process.env.EWAY_API_KEY = 'test_api_key';
    process.env.EWAY_PASSWORD = 'test_password';
    process.env.EWAY_CUSTOMER_API = 'Sandbox';
    
    ewayApiService = new EwayApiService();
  });

  describe('createTokenCustomer', () => {
    test('expected use case - creates token customer successfully', async () => {
      // Mock successful eWAY API response
      const mockResponse = {
        Customer: {
          TokenCustomerID: 'test_token_123',
          Reference: 'user_456',
          Title: 'Mr',
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '1234567890'
        },
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const customerData = {
        reference: 'user_456',
        title: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        cardDetails: {
          name: 'John Doe',
          number: '4444333322221111',
          expiryMonth: '12',
          expiryYear: '25',
          cvn: '123'
        }
      };

      const result = await ewayApiService.createTokenCustomer(customerData);

      expect(result.success).toBe(true);
      expect(result.tokenCustomerId).toBe('test_token_123');
      expect(result.customer.email).toBe('john@example.com');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/Customer'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic'),
            'Content-Type': 'application/json'
          })
        })
      );
    });

    test('edge case - handles eWAY validation errors gracefully', async () => {
      const mockErrorResponse = {
        Customer: null,
        Errors: ['V6040', 'V6041'] // Invalid card number, invalid expiry
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      });

      const invalidCustomerData = {
        reference: 'user_456',
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        cardDetails: {
          name: 'John Doe',
          number: '1234',
          expiryMonth: '13',
          expiryYear: '20',
          cvn: '12'
        }
      };

      const result = await ewayApiService.createTokenCustomer(invalidCustomerData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('V6040');
      expect(result.errors).toContain('V6041');
      expect(result.tokenCustomerId).toBeNull();
    });

    test('failure case - throws error for network/API failures', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const customerData = {
        reference: 'user_456',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        cardDetails: {
          name: 'John Doe',
          number: '4444333322221111',
          expiryMonth: '12',
          expiryYear: '25',
          cvn: '123'
        }
      };

      await expect(ewayApiService.createTokenCustomer(customerData))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('processPayment', () => {
    test('expected use case - processes payment successfully', async () => {
      const mockPaymentResponse = {
        TransactionID: 'txn_789',
        TransactionStatus: true,
        TransactionType: 'Purchase',
        TotalAmount: 2000,
        ResponseCode: '00',
        ResponseMessage: 'A2000',
        AuthorisationCode: 'AUTH123',
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockPaymentResponse)
      });

      const paymentData = {
        tokenCustomerId: 'test_token_123',
        amount: 2000, // $20.00 in cents
        currency: 'AUD',
        invoiceReference: 'INV_001',
        invoiceDescription: 'Subscription payment'
      };

      const result = await ewayApiService.processPayment(paymentData);

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn_789');
      expect(result.amount).toBe(2000);
      expect(result.responseCode).toBe('00');
      expect(result.authorisationCode).toBe('AUTH123');
    });

    test('edge case - handles declined payment', async () => {
      const mockDeclineResponse = {
        TransactionID: 'txn_failed_456',
        TransactionStatus: false,
        TransactionType: 'Purchase',
        TotalAmount: 2000,
        ResponseCode: '05',
        ResponseMessage: 'Do Not Honour',
        AuthorisationCode: null,
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockDeclineResponse)
      });

      const paymentData = {
        tokenCustomerId: 'test_token_123',
        amount: 2000,
        currency: 'AUD',
        invoiceReference: 'INV_002'
      };

      const result = await ewayApiService.processPayment(paymentData);

      expect(result.success).toBe(false);
      expect(result.transactionId).toBe('txn_failed_456');
      expect(result.responseCode).toBe('05');
      expect(result.responseMessage).toBe('Do Not Honour');
      expect(result.authorisationCode).toBeNull();
    });

    test('failure case - throws error for invalid payment amount', async () => {
      const invalidPaymentData = {
        tokenCustomerId: 'test_token_123',
        amount: -100, // Invalid negative amount
        currency: 'AUD',
        invoiceReference: 'INV_003'
      };

      await expect(ewayApiService.processPayment(invalidPaymentData))
        .rejects
        .toThrow('Payment amount must be positive');
    });
  });

  describe('refundPayment', () => {
    test('expected use case - processes refund successfully', async () => {
      const mockRefundResponse = {
        TransactionID: 'refund_123',
        TransactionStatus: true,
        TransactionType: 'Refund',
        TotalAmount: 1000,
        ResponseCode: '00',
        ResponseMessage: 'A2000',
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRefundResponse)
      });

      const refundData = {
        originalTransactionId: 'txn_789',
        amount: 1000, // Partial refund
        reason: 'Customer request'
      };

      const result = await ewayApiService.refundPayment(refundData);

      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund_123');
      expect(result.amount).toBe(1000);
      expect(result.responseCode).toBe('00');
    });

    test('edge case - handles refund amount exceeding original payment', async () => {
      const mockErrorResponse = {
        TransactionID: null,
        TransactionStatus: false,
        Errors: ['V6011'] // Invalid amount - exceeds original
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      });

      const invalidRefundData = {
        originalTransactionId: 'txn_789',
        amount: 5000, // More than original $20.00
        reason: 'Test refund'
      };

      const result = await ewayApiService.refundPayment(invalidRefundData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('V6011');
      expect(result.refundId).toBeNull();
    });

    test('failure case - throws error for missing original transaction', async () => {
      const refundData = {
        originalTransactionId: '', // Empty transaction ID
        amount: 1000,
        reason: 'Test'
      };

      await expect(ewayApiService.refundPayment(refundData))
        .rejects
        .toThrow('Original transaction ID is required');
    });
  });

  describe('queryCustomer', () => {
    test('expected use case - retrieves customer information', async () => {
      const mockCustomerResponse = {
        Customer: {
          TokenCustomerID: 'test_token_123',
          Reference: 'user_456',
          Title: 'Mr',
          FirstName: 'John',
          LastName: 'Doe',
          Email: 'john@example.com',
          Phone: '1234567890',
          CardDetails: {
            Number: '411111XXXXXX1111',
            Name: 'John Doe',
            ExpiryMonth: '12',
            ExpiryYear: '25'
          }
        },
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCustomerResponse)
      });

      const result = await ewayApiService.queryCustomer('test_token_123');

      expect(result.success).toBe(true);
      expect(result.customer.tokenCustomerId).toBe('test_token_123');
      expect(result.customer.email).toBe('john@example.com');
      expect(result.customer.cardDetails.number).toBe('411111XXXXXX1111');
    });

    test('edge case - handles non-existent customer', async () => {
      const mockNotFoundResponse = {
        Customer: null,
        Errors: ['V6010'] // Customer not found
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotFoundResponse)
      });

      const result = await ewayApiService.queryCustomer('non_existent_token');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('V6010');
      expect(result.customer).toBeNull();
    });

    test('failure case - throws error for invalid token format', async () => {
      await expect(ewayApiService.queryCustomer(''))
        .rejects
        .toThrow('Token customer ID is required');

      await expect(ewayApiService.queryCustomer('   '))
        .rejects
        .toThrow('Token customer ID is required');
    });
  });

  describe('updateTokenCustomer', () => {
    test('expected use case - updates customer successfully', async () => {
      const mockUpdateResponse = {
        Customer: {
          TokenCustomerID: 'test_token_123',
          Reference: 'user_456',
          Title: 'Ms',
          FirstName: 'Jane',
          LastName: 'Smith',
          Email: 'jane@example.com',
          Phone: '0987654321'
        },
        Errors: []
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockUpdateResponse)
      });

      const updateData = {
        tokenCustomerId: 'test_token_123',
        title: 'Ms',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '0987654321'
      };

      const result = await ewayApiService.updateTokenCustomer(updateData);

      expect(result.success).toBe(true);
      expect(result.customer.firstName).toBe('Jane');
      expect(result.customer.email).toBe('jane@example.com');
    });

    test('edge case - handles partial update with validation errors', async () => {
      const mockValidationResponse = {
        Customer: null,
        Errors: ['V6043'] // Invalid email format
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockValidationResponse)
      });

      const invalidUpdateData = {
        tokenCustomerId: 'test_token_123',
        email: 'invalid-email-format'
      };

      const result = await ewayApiService.updateTokenCustomer(invalidUpdateData);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('V6043');
    });

    test('failure case - throws error for missing token customer ID', async () => {
      const updateData = {
        firstName: 'John',
        lastName: 'Doe'
        // Missing tokenCustomerId
      };

      await expect(ewayApiService.updateTokenCustomer(updateData as any))
        .rejects
        .toThrow('Token customer ID is required');
    });
  });
});