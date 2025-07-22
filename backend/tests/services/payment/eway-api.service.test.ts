import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EwayApiService } from '../../../src/services/payment/eway-api.service';
import fetch from 'node-fetch';

/**
 * Comprehensive tests for EwayApiService - eWAY API integration
 * Following CLAUDE.md requirements: Expected use case, Edge case, Failure case
 */

// Mock node-fetch
vi.mock('node-fetch');
const mockFetch = vi.mocked(fetch);

describe('EwayApiService', () => {
  let ewayApiService: EwayApiService;

  beforeEach(() => {
    // Mock environment variables
    process.env.EWAY_API_KEY = 'test_api_key_12345';
    process.env.EWAY_PASSWORD = 'test_password_67890';
    process.env.NODE_ENV = 'test';
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with test credentials (expected use case)', () => {
      // Act
      ewayApiService = new EwayApiService();

      // Assert
      expect(ewayApiService).toBeDefined();
      expect((ewayApiService as any).apiKey).toBe('test_api_key_12345');
      expect((ewayApiService as any).password).toBe('test_password_67890');
      expect((ewayApiService as any).endpoint).toBe('https://api.sandbox.ewaypayments.com');
    });

    it('should use production endpoint in production (edge case)', () => {
      // Arrange
      process.env.NODE_ENV = 'production';

      // Act
      ewayApiService = new EwayApiService();

      // Assert
      expect((ewayApiService as any).endpoint).toBe('https://api.ewaypayments.com');
      
      // Cleanup
      process.env.NODE_ENV = 'test';
    });

    it('should throw error when credentials are missing (failure case)', () => {
      // Arrange
      delete process.env.EWAY_API_KEY;
      delete process.env.EWAY_PASSWORD;

      // Act & Assert
      expect(() => new EwayApiService()).toThrow('eWAY API credentials not configured');
    });
  });

  describe('createAccessCode', () => {
    beforeEach(() => {
      ewayApiService = new EwayApiService();
    });

    const validPaymentData = {
      customerDetails: {
        reference: 'user-123',
        title: 'Mr',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '1234567890',
        street1: '123 Test St',
        city: 'Sydney',
        state: 'NSW',
        postalCode: '2000',
        country: 'AU'
      },
      payment: {
        totalAmount: 29.99,
        currencyCode: 'AUD',
        invoiceNumber: 'INV-001',
        invoiceDescription: 'Subscription payment'
      },
      redirectUrl: 'https://example.com/return',
      method: 'ProcessPayment' as const,
      transactionType: 'Purchase' as const
    };

    it('should create access code successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = {
        AccessCode: 'ABC123DEF456',
        FormActionURL: 'https://secure.ewaypayments.com/Process',
        CompleteCheckoutURL: 'https://secure.ewaypayments.com/Process/ABC123DEF456',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.createAccessCode(validPaymentData);

      // Assert
      expect(result.AccessCode).toBe('ABC123DEF456');
      expect(result.FormActionURL).toBe('https://secure.ewaypayments.com/Process');
      expect(result.Errors).toHaveLength(0);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sandbox.ewaypayments.com/CreateAccessCode',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json',
            'User-Agent': 'AudioTricks/1.0'
          }),
          body: expect.any(String)
        })
      );

      // Verify request body contains correct amount in cents
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.Payment.TotalAmount).toBe(2999); // 29.99 * 100
    });

    it('should handle customer details with special characters (edge case)', async () => {
      // Arrange
      const paymentDataWithSpecialChars = {
        ...validPaymentData,
        customerDetails: {
          ...validPaymentData.customerDetails,
          firstName: 'José',
          lastName: 'O\'Connor',
          street1: '123 Test St & Co'
        }
      };

      const mockResponse = {
        AccessCode: 'XYZ789ABC123',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.createAccessCode(paymentDataWithSpecialChars);

      // Assert
      expect(result.AccessCode).toBe('XYZ789ABC123');
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle eWAY validation errors (failure case)', async () => {
      // Arrange
      const mockErrorResponse = {
        AccessCode: null,
        Errors: ['V6040', 'V6041'] // Invalid customer details
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      } as any);

      // Act & Assert
      await expect(ewayApiService.createAccessCode(validPaymentData))
        .rejects
        .toThrow('eWAY API error: V6040, V6041');
    });

    it('should handle network failures (failure case)', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      // Act & Assert
      await expect(ewayApiService.createAccessCode(validPaymentData))
        .rejects
        .toThrow('Failed to create access code: API request failed: Network timeout');
    });
  });

  describe('getTransactionResult', () => {
    beforeEach(() => {
      ewayApiService = new EwayApiService();
    });

    const accessCode = 'ABC123DEF456';

    it('should get transaction result successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = {
        AccessCode: accessCode,
        TransactionID: 12345678,
        TransactionStatus: true,
        TransactionType: 'Purchase',
        BeagleScore: 0,
        Verification: {
          CVN: 'M',
          Address: 'Y',
          Email: 'Y',
          Mobile: 'Y',
          Phone: 'Y'
        },
        Customer: {
          TokenCustomerID: 'cust_123',
          Reference: 'user-123',
          Title: 'Mr',
          FirstName: 'John',
          LastName: 'Doe',
          CompanyName: '',
          JobDescription: '',
          Street1: '123 Test St',
          Street2: '',
          City: 'Sydney',
          State: 'NSW',
          PostalCode: '2000',
          Country: 'au',
          Email: 'john@example.com',
          Phone: '1234567890'
        },
        Payment: {
          TotalAmount: 2999,
          InvoiceNumber: 'INV-001',
          InvoiceDescription: 'Subscription payment',
          InvoiceReference: '',
          CurrencyCode: 'AUD'
        },
        ResponseCode: '00',
        ResponseMessage: 'A2000',
        AuthorisationCode: 'AUTH123456',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.getTransactionResult(accessCode);

      // Assert
      expect(result.TransactionID).toBe(12345678);
      expect(result.TransactionStatus).toBe(true);
      expect(result.ResponseCode).toBe('00');
      expect(result.AuthorisationCode).toBe('AUTH123456');
      
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sandbox.ewaypayments.com/GetAccessCodeResult/${accessCode}`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /)
          })
        })
      );
    });

    it('should handle failed transaction (edge case)', async () => {
      // Arrange
      const mockFailedResponse = {
        AccessCode: accessCode,
        TransactionID: 12345679,
        TransactionStatus: false,
        ResponseCode: '05',
        ResponseMessage: 'Do Not Honour',
        AuthorisationCode: '',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockFailedResponse)
      } as any);

      // Act
      const result = await ewayApiService.getTransactionResult(accessCode);

      // Assert
      expect(result.TransactionStatus).toBe(false);
      expect(result.ResponseCode).toBe('05');
      expect(result.ResponseMessage).toBe('Do Not Honour');
      expect(result.AuthorisationCode).toBe('');
    });

    it('should handle API errors (failure case)', async () => {
      // Arrange
      const mockErrorResponse = {
        Errors: ['V6010'] // Customer not found
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      } as any);

      // Act & Assert
      await expect(ewayApiService.getTransactionResult(accessCode))
        .rejects
        .toThrow('eWAY API error: V6010');
    });
  });

  describe('createRecurringSchedule', () => {
    beforeEach(() => {
      ewayApiService = new EwayApiService();
    });

    const validScheduleParams = {
      tokenCustomerId: 'cust_123',
      amount: 29.99,
      currency: 'AUD',
      frequency: 'Monthly' as const,
      startDate: new Date('2024-02-01'),
      invoiceDescription: 'Monthly subscription'
    };

    it('should create recurring schedule successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = {
        ScheduleID: 'sched_789',
        TokenCustomer: {
          TokenCustomerID: 'cust_123'
        },
        Payment: {
          TotalAmount: 2999,
          CurrencyCode: 'AUD'
        },
        Schedule: {
          StartDate: '2024-02-01',
          Frequency: 'Monthly',
          NextPaymentDate: '2024-02-01'
        },
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.createRecurringSchedule(validScheduleParams);

      // Assert
      expect(result.ScheduleID).toBe('sched_789');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sandbox.ewaypayments.com/Recurring/Create',
        expect.objectContaining({
          method: 'POST'
        })
      );

      // Verify amount conversion to cents
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.Payment.TotalAmount).toBe(2999);
    });

    it('should handle schedule with end date (edge case)', async () => {
      // Arrange
      const paramsWithEndDate = {
        ...validScheduleParams,
        endDate: new Date('2024-12-31')
      };

      const mockResponse = {
        ScheduleID: 'sched_456',
        Schedule: {
          StartDate: '2024-02-01',
          EndDate: '2024-12-31',
          Frequency: 'Monthly'
        },
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.createRecurringSchedule(paramsWithEndDate);

      // Assert
      expect(result.ScheduleID).toBe('sched_456');
      
      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1]?.body as string);
      expect(requestBody.Schedule.EndDate).toBe('2024-12-31');
    });

    it('should handle invalid token customer (failure case)', async () => {
      // Arrange
      const mockErrorResponse = {
        Errors: ['V6010'] // Customer not found
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      } as any);

      // Act & Assert
      await expect(ewayApiService.createRecurringSchedule(validScheduleParams))
        .rejects
        .toThrow('eWAY API error: V6010');
    });
  });

  describe('cancelRecurringSchedule', () => {
    beforeEach(() => {
      ewayApiService = new EwayApiService();
    });

    const scheduleId = 'sched_789';

    it('should cancel recurring schedule successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = {
        ScheduleID: scheduleId,
        Status: 'Cancelled',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.cancelRecurringSchedule(scheduleId);

      // Assert
      expect(result.ScheduleID).toBe(scheduleId);
      expect(result.Status).toBe('Cancelled');
      
      expect(mockFetch).toHaveBeenCalledWith(
        `https://api.sandbox.ewaypayments.com/Recurring/Cancel/${scheduleId}`,
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('should handle already cancelled schedule (edge case)', async () => {
      // Arrange
      const mockResponse = {
        ScheduleID: scheduleId,
        Status: 'Already Cancelled',
        Errors: []
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.cancelRecurringSchedule(scheduleId);

      // Assert
      expect(result.Status).toBe('Already Cancelled');
    });

    it('should handle non-existent schedule (failure case)', async () => {
      // Arrange
      const mockErrorResponse = {
        Errors: ['V6020'] // Schedule not found
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockErrorResponse)
      } as any);

      // Act & Assert
      await expect(ewayApiService.cancelRecurringSchedule(scheduleId))
        .rejects
        .toThrow('eWAY API error: V6020');
    });
  });

  describe('makeApiRequest', () => {
    beforeEach(() => {
      ewayApiService = new EwayApiService();
    });

    it('should make GET request successfully (expected use case)', async () => {
      // Arrange
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.makeApiRequest('/test-endpoint', 'GET');

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sandbox.ewaypayments.com/test-endpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringMatching(/^Basic /),
            'Content-Type': 'application/json',
            'User-Agent': 'AudioTricks/1.0'
          })
        })
      );
    });

    it('should make POST request with data (edge case)', async () => {
      // Arrange
      const mockResponse = { success: true };
      const postData = { name: 'test', value: 123 };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      // Act
      const result = await ewayApiService.makeApiRequest('/post-endpoint', 'POST', postData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.sandbox.ewaypayments.com/post-endpoint',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData)
        })
      );
    });

    it('should handle HTTP error responses (failure case)', async () => {
      // Arrange
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      } as any);

      // Act & Assert
      await expect(ewayApiService.makeApiRequest('/secure-endpoint', 'GET'))
        .rejects
        .toThrow('API request failed: HTTP 401: Unauthorized');
    });

    it('should handle network failures (failure case)', async () => {
      // Arrange
      mockFetch.mockRejectedValue(new Error('ECONNRESET'));

      // Act & Assert
      await expect(ewayApiService.makeApiRequest('/test-endpoint', 'GET'))
        .rejects
        .toThrow('API request failed: ECONNRESET');
    });
  });
});