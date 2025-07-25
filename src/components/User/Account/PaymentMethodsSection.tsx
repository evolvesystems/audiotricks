/**
 * Payment Methods Section Component
 * Manages user payment methods
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  CreditCardIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import PaymentMethodCard from './PaymentMethodCard';
import AddPaymentMethodModal from './AddPaymentMethodModal';
import { apiClient } from '../../../services/api';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface PaymentMethodsSectionProps {
  onUpdate: () => void;
}

export default function PaymentMethodsSection({ onUpdate }: PaymentMethodsSectionProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const data = await apiClient.get('/user/payment-methods');
      setPaymentMethods(data.methods || mockPaymentMethods);
    } catch (error) {
      logger.error('Error fetching payment methods:', error);
      setPaymentMethods(mockPaymentMethods);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      await apiClient.put(`/user/payment-methods/${methodId}/default`);
      fetchPaymentMethods();
    } catch (error) {
      logger.error('Error setting default payment method:', error);
    }
  };

  const handleRemove = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await apiClient.delete(`/user/payment-methods/${methodId}`);
      fetchPaymentMethods();
    } catch (error) {
      logger.error('Error removing payment method:', error);
    }
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Payment Methods</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Payment Method
        </button>
      </div>

      {/* Payment Methods List */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12">
          <CreditCardIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment methods</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a payment method.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Payment Method
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              onSetDefault={handleSetDefault}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}

      <AddPaymentMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={() => {
          // Handle payment method addition
          setShowAddModal(false);
          fetchPaymentMethods();
        }}
      />
    </div>
  );
}

// Mock data for development
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '5555',
    expiryMonth: 8,
    expiryYear: 2026,
    isDefault: false
  }
];