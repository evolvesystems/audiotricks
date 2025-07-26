/**
 * Payment Method Management Hook
 */

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { SubscriptionService } from '../../../services/subscription';
import { createDebugLogger } from '../../../utils/debug-logger';

const debug = createDebugLogger('payment-method');

export function usePaymentMethod(
  workspaceId: string,
  clientSecret: string,
  onPaymentMethodSaved?: (paymentMethodId: string) => void,
  onError?: (error: string) => void
) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePaymentMethodSetup = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      const errorMsg = 'Stripe not loaded. Please refresh the page.';
      setError(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      const errorMsg = 'Card element not found';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      return;
    }

    try {
      debug.log('Starting payment method setup', { workspaceId });

      // Confirm the setup intent
      const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Workspace Payment Method',
            },
          },
        }
      );

      if (stripeError) {
        debug.error('Stripe setup error', stripeError);
        setError(stripeError.message || 'Payment setup failed');
        onError?.(stripeError.message || 'Payment setup failed');
        return;
      }

      if (setupIntent?.payment_method) {
        debug.log('Payment method setup successful', { 
          paymentMethodId: setupIntent.payment_method 
        });

        // Save payment method to backend
        await SubscriptionService.savePaymentMethod(
          workspaceId,
          setupIntent.payment_method as string
        );

        onPaymentMethodSaved?.(setupIntent.payment_method as string);
      }

    } catch (error: any) {
      debug.error('Payment method setup failed', error);
      const errorMsg = error.message || 'Failed to save payment method';
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    loading,
    error,
    handlePaymentMethodSetup,
    clearError,
    isStripeReady: !!(stripe && elements)
  };
}