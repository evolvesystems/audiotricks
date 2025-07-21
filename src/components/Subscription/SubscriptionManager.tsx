import React, { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionDetails, BillingRecord, UsageData } from '../../services/subscription';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { SubscriptionOverview } from './SubscriptionOverview';
import { UsageDisplay } from './UsageDisplay';
import { BillingHistory } from './BillingHistory';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';

interface SubscriptionManagerProps {
  workspaceId: string;
  onSubscriptionChange?: () => void;
}

/**
 * Main subscription manager component (refactored for CLAUDE.md compliance)
 * Orchestrates subscription overview, usage, billing, and modal components
 */
export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  workspaceId,
  onSubscriptionChange
}) => {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    loadSubscriptionData();
  }, [workspaceId]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscriptionData, billingData, usageData] = await Promise.all([
        subscriptionService.getSubscription(workspaceId),
        subscriptionService.getBillingHistory(workspaceId, 5),
        subscriptionService.getCurrentUsage(workspaceId).catch(() => null)
      ]);

      setSubscription(subscriptionData);
      setBillingHistory(billingData);
      setUsage(usageData);
    } catch (err: any) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (reason: string) => {
    try {
      setCancelling(true);
      await subscriptionService.cancelSubscription(workspaceId, reason);
      setShowCancelModal(false);
      await loadSubscriptionData();
      onSubscriptionChange?.();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelling(false);
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
        <Button onClick={loadSubscriptionData} variant="outline" size="sm" className="ml-4">
          Retry
        </Button>
      </Alert>
    );
  }

  if (!subscription) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4">No active subscription found</div>
        <Button onClick={() => window.location.href = `/workspaces/${workspaceId}/subscription/plans`}>
          Choose a Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Subscription Overview */}
      <SubscriptionOverview
        subscription={subscription}
        workspaceId={workspaceId}
        onCancelClick={() => setShowCancelModal(true)}
      />

      {/* Usage Statistics */}
      {usage && (
        <UsageDisplay
          usage={usage}
          currency={subscription.currency}
        />
      )}

      {/* Billing History */}
      <BillingHistory
        billingHistory={billingHistory}
        workspaceId={workspaceId}
        currency={subscription.currency}
      />

      {/* Cancel Subscription Modal */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        isLoading={cancelling}
      />
    </div>
  );
};

export default SubscriptionManager;