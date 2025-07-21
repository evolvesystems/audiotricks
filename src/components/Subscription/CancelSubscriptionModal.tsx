import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

/**
 * Modal component for subscription cancellation
 */
export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading
}) => {
  const [cancelReason, setCancelReason] = useState('');

  const handleConfirm = () => {
    onConfirm(cancelReason);
    setCancelReason('');
  };

  const handleClose = () => {
    setCancelReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            onClick={handleClose}
            disabled={isLoading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};