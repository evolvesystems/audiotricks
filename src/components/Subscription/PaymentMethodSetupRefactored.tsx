/**
 * Refactored Payment Method Setup Component
 * Uses custom hooks for better separation of concerns
 */

import React from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
} from '@stripe/react-stripe-js';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Alert } from '../ui/Alert';
import { useStripeSetup } from './hooks/useStripeSetup';
import { usePaymentMethod } from './hooks/usePaymentMethod';

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
  const {
    loading,
    error,
    handlePaymentMethodSetup,
    clearError,
    isStripeReady
  } = usePaymentMethod(workspaceId, clientSecret, onPaymentMethodSaved, onError);

  return (
    <form onSubmit={handlePaymentMethodSetup} className="space-y-6">
      {error && (
        <Alert type="error" onDismiss={clearError}>
          {error}
        </Alert>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="p-4 border border-gray-300 rounded-lg bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#374151',
                  '::placeholder': {
                    color: '#9CA3AF',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!isStripeReady || loading}
        className="w-full"
      >
        {loading ? (
          <>
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Setting up payment method...
          </>
        ) : (
          'Save Payment Method'
        )}
      </Button>
    </form>
  );
};

export default function PaymentMethodSetup({
  workspaceId,
  onPaymentMethodSaved,
  onError
}: PaymentMethodSetupProps) {
  const { clientSecret, loading, error, retrySetup } = useStripeSetup(workspaceId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="w-8 h-8" />
        <span className="ml-3">Initializing payment setup...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error">
        <div className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={retrySetup}>
            Retry
          </Button>
        </div>
      </Alert>
    );
  }

  if (!clientSecret) {
    return (
      <Alert type="error">
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
      <Elements stripe={stripePromise} options={elementsOptions}>
        <PaymentForm
          workspaceId={workspaceId}
          clientSecret={clientSecret}
          onPaymentMethodSaved={onPaymentMethodSaved}
          onError={onError}
        />
      </Elements>
    </div>
  );
}