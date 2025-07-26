/**
 * Stripe Setup Hook
 */

import { useState, useEffect } from 'react';
import { SubscriptionService } from '../../../services/subscription';
import { createDebugLogger } from '../../../utils/debug-logger';

const debug = createDebugLogger('stripe-setup');

export function useStripeSetup(workspaceId: string) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeStripeSetup();
  }, [workspaceId]);

  const initializeStripeSetup = async () => {
    if (!workspaceId) {
      setError('Workspace ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      debug.log('Initializing Stripe setup', { workspaceId });
      
      const response = await SubscriptionService.createSetupIntent(workspaceId);
      
      if (response.clientSecret) {
        setClientSecret(response.clientSecret);
        debug.log('Stripe setup initialized', { clientSecret: '***' });
      } else {
        throw new Error('No client secret received');
      }
      
    } catch (error: any) {
      debug.error('Failed to initialize Stripe setup', error);
      setError(error.message || 'Failed to initialize payment setup');
    } finally {
      setLoading(false);
    }
  };

  const retrySetup = () => {
    initializeStripeSetup();
  };

  return {
    clientSecret,
    loading,
    error,
    retrySetup
  };
}