import React, { useState, useEffect } from 'react';
import { SubscriptionService, SubscriptionDetails, BillingRecord, UsageData } from '../../services/subscription';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Alert } from '../ui/Alert';

interface SubscriptionManagerProps {
  workspaceId: string;
  onSubscriptionChange?: () => void;
}

interface UsageProgressProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

const UsageProgress: React.FC<UsageProgressProps> = ({ label, used, limit, unit = '' }) => {
  const subscriptionService = new SubscriptionService();
  const percentage = subscriptionService.getUsagePercentage(used, limit);
  const color = subscriptionService.getUsageStatusColor(percentage);

  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          {used.toLocaleString()}{unit} / {limit.toLocaleString()}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color]}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <span className={`text-xs font-medium ${
          percentage >= 90 ? 'text-red-600' : 
          percentage >= 75 ? 'text-orange-600' : 
          'text-gray-500'
        }`}>
          {percentage}% used
        </span>
        {percentage >= 90 && (
          <span className="text-xs text-red-600">
            Approaching limit
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * SubscriptionManager component for managing workspace subscriptions
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
  const [cancelReason, setCancelReason] = useState('');
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

  const handleCancelSubscription = async () => {
    try {
      setCancelling(true);
      await subscriptionService.cancelSubscription(workspaceId, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
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

  const statusBadge = subscriptionService.getStatusBadge(subscription.status);
  const isTrialing = subscription.status === 'trialing';
  const isCancelled = subscription.status === 'cancelled';
  const trialDaysLeft = subscription.trialEnd 
    ? subscriptionService.getDaysUntilTrialEnd(subscription.trialEnd)
    : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Subscription Overview */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Subscription Overview
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-lg font-medium text-gray-700">
                {subscription.plan.displayName}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusBadge.color === 'green' ? 'bg-green-100 text-green-800' :
                statusBadge.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                statusBadge.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                statusBadge.color === 'red' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusBadge.text}
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {subscriptionService.formatCurrency(subscription.amount, subscription.currency)}
            </div>
            <div className="text-sm text-gray-600">
              per {subscription.plan.pricing[0]?.billingPeriod || 'month'}
            </div>
          </div>
        </div>

        {/* Trial Warning */}
        {isTrialing && trialDaysLeft <= 7 && (
          <Alert variant="warning" className="mb-6">
            <div className="flex justify-between items-center">
              <span>
                Your trial expires in {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''}
              </span>
              <Button size="sm" onClick={() => window.location.href = `/workspaces/${workspaceId}/billing/payment-methods`}>
                Add Payment Method
              </Button>
            </div>
          </Alert>
        )}

        {/* Subscription Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Plan Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd className="text-gray-900">{statusBadge.text}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Current Period:</dt>
                <dd className="text-gray-900">
                  {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </dd>
              </div>
              {subscription.trialEnd && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Trial Ends:</dt>
                  <dd className="text-gray-900">
                    {new Date(subscription.trialEnd).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {subscription.nextInvoice && (
                <div className="flex justify-between">
                  <dt className="text-gray-600">Next Billing:</dt>
                  <dd className="text-gray-900">
                    {subscriptionService.formatCurrency(subscription.nextInvoice.amount, subscription.currency)} on{' '}
                    {new Date(subscription.nextInvoice.date).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = `/workspaces/${workspaceId}/subscription/change-plan`}
                disabled={isCancelled}
              >
                Change Plan
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = `/workspaces/${workspaceId}/billing/payment-methods`}
                disabled={isCancelled}
              >
                Manage Payment Methods
              </Button>
              {!isCancelled && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Usage This Period</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <UsageProgress
                label="Storage Used"
                used={usage.usage.storage_used?.quantity || 0}
                limit={usage.quotas.storage_gb}
                unit=" GB"
              />
              <UsageProgress
                label="Processing Minutes"
                used={usage.usage.processing_minutes?.quantity || 0}
                limit={usage.quotas.processing_minutes}
                unit=" min"
              />
              <UsageProgress
                label="Transcription Minutes"
                used={usage.usage.transcription_minutes?.quantity || 0}
                limit={usage.quotas.transcription_minutes}
                unit=" min"
              />
            </div>
            
            <div>
              <UsageProgress
                label="API Calls"
                used={usage.usage.api_calls?.quantity || 0}
                limit={usage.quotas.api_calls_per_month}
              />
              <UsageProgress
                label="AI Tokens"
                used={usage.usage.ai_tokens?.quantity || 0}
                limit={usage.quotas.ai_tokens_per_month}
              />
              
              {usage.totalCost > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Usage Charges:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {subscriptionService.formatCurrency(usage.totalCost, subscription.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Additional charges for overage usage
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Billing</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = `/workspaces/${workspaceId}/billing/history`}
            >
              View All
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 text-sm font-medium text-gray-600">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {billingHistory.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100">
                    <td className="py-3 text-sm text-gray-900">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {subscriptionService.formatCurrency(record.amount, record.currency)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'paid' ? 'bg-green-100 text-green-800' :
                        record.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3">
                      {record.invoiceUrl ? (
                        <a
                          href={record.invoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to cancel your subscription? Your access will continue until the end of your current billing period.
          </p>

          <div>
            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation (optional):
            </label>
            <textarea
              id="cancelReason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Help us improve by sharing why you're cancelling..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="primary"
              onClick={handleCancelSubscription}
              disabled={cancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};