import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PaymentMethodSetup } from '../../../components/Subscription/PaymentMethodSetup';
import { SubscriptionService } from '../../../services/subscription';

/**
 * Comprehensive tests for PaymentMethodSetup component
 * Following CLAUDE.md requirements: Expected use case, Edge case, Failure case
 */

// Mock Stripe
const mockStripe = {
  confirmCardSetup: vi.fn(),
};

const mockElements = {
  getElement: vi.fn(),
};

const mockCardElement = {
  mount: vi.fn(),
  destroy: vi.fn(),
  on: vi.fn(),
  update: vi.fn(),
};

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: ({ options }: any) => (
    <div data-testid="card-element" data-options={JSON.stringify(options)}>
      Mock Card Element
    </div>
  ),
  useStripe: () => mockStripe,
  useElements: () => mockElements,
}));

// Mock SubscriptionService
vi.mock('../../../services/subscription');
const MockedSubscriptionService = vi.mocked(SubscriptionService);

// Mock UI components
vi.mock('../../../components/ui/Button', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('../../../components/ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, className }: any) => (
    <div data-testid="loading-spinner" data-size={size} className={className}>
      Loading...
    </div>
  ),
}));

vi.mock('../../../components/ui/Alert', () => ({
  Alert: ({ children, variant, className }: any) => (
    <div data-testid="alert" data-variant={variant} className={className}>
      {children}
    </div>
  ),
}));

describe('PaymentMethodSetup', () => {
  const defaultProps = {
    workspaceId: 'workspace-123',
    onPaymentMethodSaved: vi.fn(),
    onError: vi.fn(),
  };

  let mockSubscriptionService: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSubscriptionService = {
      createSetupIntent: vi.fn(),
    };
    MockedSubscriptionService.mockImplementation(() => mockSubscriptionService);
    mockElements.getElement.mockReturnValue(mockCardElement);

    // Mock environment variable
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('component initialization', () => {
    it('should initialize and create setup intent successfully (expected use case)', async () => {
      // Arrange
      const mockClientSecret = 'pi_test_123_secret';
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: mockClientSecret,
      });

      // Act
      render(<PaymentMethodSetup {...defaultProps} />);

      // Assert - Initially shows loading
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

      // Wait for setup intent creation
      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });

      expect(mockSubscriptionService.createSetupIntent).toHaveBeenCalledWith(defaultProps.workspaceId);
      expect(screen.getByText('Add Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Add a payment method to complete your subscription setup.')).toBeInTheDocument();
    });

    it('should handle missing Stripe publishable key (edge case)', async () => {
      // Arrange
      delete process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
      });

      // Act
      render(<PaymentMethodSetup {...defaultProps} />);

      // Assert - Should still work with empty key (loadStripe handles this gracefully)
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });
    });

    it('should handle setup intent creation failure (failure case)', async () => {
      // Arrange
      const errorMessage = 'Failed to initialize payment setup';
      mockSubscriptionService.createSetupIntent.mockRejectedValue(new Error(errorMessage));

      // Act
      render(<PaymentMethodSetup {...defaultProps} />);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(defaultProps.onError).toHaveBeenCalledWith(errorMessage);
    });
  });

  describe('payment form submission', () => {
    beforeEach(async () => {
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
      });

      render(<PaymentMethodSetup {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });
    });

    it('should process payment method setup successfully (expected use case)', async () => {
      // Arrange
      const mockPaymentMethodId = 'pm_test_456';
      mockStripe.confirmCardSetup.mockResolvedValue({
        setupIntent: {
          payment_method: mockPaymentMethodId,
        },
      });

      // Act
      const saveButton = screen.getByText('Save Payment Method');
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(mockStripe.confirmCardSetup).toHaveBeenCalledWith(
          'pi_test_123_secret',
          expect.objectContaining({
            payment_method: expect.objectContaining({
              card: mockCardElement,
              billing_details: {},
            }),
          })
        );
      });

      expect(defaultProps.onPaymentMethodSaved).toHaveBeenCalledWith(mockPaymentMethodId);
    });

    it('should handle card validation errors (edge case)', async () => {
      // Arrange
      const cardError = {
        message: 'Your card number is incomplete.',
      };
      mockStripe.confirmCardSetup.mockResolvedValue({
        error: cardError,
      });

      // Act
      const saveButton = screen.getByText('Save Payment Method');
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Your card number is incomplete.')).toBeInTheDocument();
      expect(defaultProps.onError).toHaveBeenCalledWith('Your card number is incomplete.');
      expect(defaultProps.onPaymentMethodSaved).not.toHaveBeenCalled();
    });

    it('should handle Stripe not loaded error (failure case)', async () => {
      // Arrange
      vi.mocked(mockStripe).confirmCardSetup = undefined as any;

      // Act
      const saveButton = screen.getByText('Save Payment Method');
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Stripe not loaded. Please refresh the page.')).toBeInTheDocument();
    });

    it('should handle missing card element (failure case)', async () => {
      // Arrange
      mockElements.getElement.mockReturnValue(null);

      // Act
      const saveButton = screen.getByText('Save Payment Method');
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('alert')).toBeInTheDocument();
      });

      expect(screen.getByText('Card element not found')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show loading spinner during setup intent creation (expected use case)', () => {
      // Arrange
      mockSubscriptionService.createSetupIntent.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      render(<PaymentMethodSetup {...defaultProps} />);

      // Assert
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.queryByText('Add Payment Method')).not.toBeInTheDocument();
    });

    it('should show loading state during form submission (edge case)', async () => {
      // Arrange
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
      });

      render(<PaymentMethodSetup {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });

      // Mock slow stripe confirmation
      mockStripe.confirmCardSetup.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      // Act
      const saveButton = screen.getByText('Save Payment Method');
      fireEvent.click(saveButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      expect(saveButton).toBeDisabled();
    });
  });

  describe('error recovery', () => {
    it('should allow retry after setup intent failure (expected use case)', async () => {
      // Arrange
      mockSubscriptionService.createSetupIntent
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ clientSecret: 'pi_test_retry_secret' });

      render(<PaymentMethodSetup {...defaultProps} />);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Act
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });

      expect(mockSubscriptionService.createSetupIntent).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple consecutive failures (edge case)', async () => {
      // Arrange
      mockSubscriptionService.createSetupIntent.mockRejectedValue(new Error('Persistent error'));

      render(<PaymentMethodSetup {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Act - First retry
      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // Act - Second retry
      fireEvent.click(screen.getByText('Try Again'));

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Persistent error')).toBeInTheDocument();
      });

      expect(mockSubscriptionService.createSetupIntent).toHaveBeenCalledTimes(3);
      expect(defaultProps.onError).toHaveBeenCalledTimes(3);
    });
  });

  describe('accessibility and UI elements', () => {
    beforeEach(async () => {
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
      });

      render(<PaymentMethodSetup {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });
    });

    it('should have proper form labels and structure (expected use case)', () => {
      // Assert
      expect(screen.getByText('Card Information')).toBeInTheDocument();
      expect(screen.getByText('Your payment information is securely processed by Stripe and never stored on our servers.')).toBeInTheDocument();
      expect(screen.getByText('SSL Secured')).toBeInTheDocument();
      expect(screen.getByText('Powered by Stripe')).toBeInTheDocument();
    });

    it('should configure Stripe Elements with correct options (edge case)', () => {
      // Assert
      const cardElement = screen.getByTestId('card-element');
      const options = JSON.parse(cardElement.getAttribute('data-options') || '{}');
      
      expect(options.style).toBeDefined();
      expect(options.style.base.fontSize).toBe('16px');
      expect(options.hidePostalCode).toBe(false);
    });

    it('should handle form submission with Enter key (edge case)', async () => {
      // Arrange
      mockStripe.confirmCardSetup.mockResolvedValue({
        setupIntent: { payment_method: 'pm_test_enter' },
      });

      // Act
      const form = screen.getByRole('button', { name: 'Save Payment Method' }).closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      // Assert
      await waitFor(() => {
        expect(mockStripe.confirmCardSetup).toHaveBeenCalled();
      });
    });
  });

  describe('component cleanup', () => {
    it('should handle component unmounting gracefully (edge case)', async () => {
      // Arrange
      mockSubscriptionService.createSetupIntent.mockResolvedValue({
        clientSecret: 'pi_test_123_secret',
      });

      const { unmount } = render(<PaymentMethodSetup {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();
      });

      // Act
      unmount();

      // Assert - No errors should be thrown
      expect(mockSubscriptionService.createSetupIntent).toHaveBeenCalledTimes(1);
    });
  });
});