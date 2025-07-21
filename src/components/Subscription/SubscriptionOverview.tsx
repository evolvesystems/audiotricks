import React from 'react';
import { SubscriptionDetails, SubscriptionService } from '../../services/subscription';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

interface SubscriptionOverviewProps {
  subscription: SubscriptionDetails;
  workspaceId: string;
  onCancelClick: () => void;
}

/**
 * Subscription overview component displaying plan details and actions
 */
export const SubscriptionOverview: React.FC<SubscriptionOverviewProps> = ({
  subscription,
  workspaceId,
  onCancelClick
}) => {
  const subscriptionService = new SubscriptionService();
  const statusBadge = subscriptionService.getStatusBadge(subscription.status);
  const isTrialing = subscription.status === 'trialing';
  const isCancelled = subscription.status === 'cancelled';
  const trialDaysLeft = subscription.trialEnd 
    ? subscriptionService.getDaysUntilTrialEnd(subscription.trialEnd)
    : 0;

  return (
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
                onClick={onCancelClick}
              >
                Cancel Subscription
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};