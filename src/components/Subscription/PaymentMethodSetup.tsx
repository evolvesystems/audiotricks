import React, { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { SubscriptionService } from '../../services/subscription';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';

// Initialize Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentMethodSetupProps {
  workspaceId: string;
  onPaymentMethodSaved?: (paymentMethodId: string) => void;
  onError?: (error: string) => void;
}

interface PaymentFormProps extends PaymentMethodSetupProps {
  clientSecret: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  workspaceId,
  clientSecret,
  onPaymentMethodSaved,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found');
      setLoading(false);
      return;
    }

    try {
      // Confirm the setup intent
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              // You can add billing details here if needed
            }
          }
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (setupIntent && setupIntent.payment_method) {
        onPaymentMethodSaved?.(setupIntent.payment_method as string);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save payment method';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        iconColor: '#666EE8',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Information
        </label>
        <div className="border border-gray-300 rounded-md p-3 bg-white">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Your payment information is securely processed by Stripe and never stored on our servers.
        </p>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="submit"
          disabled={!stripe || loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            'Save Payment Method'
          )}
        </Button>
      </div>
    </form>
  );
};

/**
 * PaymentMethodSetup component for adding new payment methods
 */
export const PaymentMethodSetup: React.FC<PaymentMethodSetupProps> = ({
  workspaceId,
  onPaymentMethodSaved,
  onError
}) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    createSetupIntent();
  }, [workspaceId]);

  const createSetupIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      const { clientSecret: secret } = await subscriptionService.createSetupIntent(workspaceId);
      setClientSecret(secret);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to initialize payment setup';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="mb-6">
        {error}
        <Button onClick={createSetupIntent} variant="outline" size="sm" className="ml-4">
          Try Again
        </Button>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert variant="error">
        Failed to initialize payment setup. Please try again.
      </Alert>
    );
  }

  const elementsOptions: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3B82F6',
      },
    },
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Add Payment Method
          </h3>
          <p className="text-gray-600">
            Add a payment method to complete your subscription setup.
          </p>
        </div>

        <Elements stripe={stripePromise} options={elementsOptions}>
          <PaymentForm
            workspaceId={workspaceId}
            clientSecret={clientSecret}
            onPaymentMethodSaved={onPaymentMethodSaved}
            onError={onError}
          />
        </Elements>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              SSL Secured
            </div>
            <div className="flex items-center">
              <img src="/stripe-logo.png" alt="Stripe" className="h-4 mr-1" />
              Powered by Stripe
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Export a wrapper component that handles Stripe initialization
export const PaymentMethodSetupWrapper: React.FC<PaymentMethodSetupProps> = (props) => {
  return (
    <PaymentMethodSetup {...props} />
  );
};