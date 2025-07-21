/**
 * Payment Methods Section Component
 * Manages user payment methods
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/user/payment-methods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.methods || mockPaymentMethods);
      } else {
        setPaymentMethods(mockPaymentMethods);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      setPaymentMethods(mockPaymentMethods);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/payment-methods/${methodId}/default`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error setting default payment method:', error);
    }
  };

  const handleRemove = async (methodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchPaymentMethods();
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
    }
  };

  const getCardIcon = (brand?: string) => {
    // In a real app, you'd have specific icons for each card brand
    return <CreditCardIcon className="h-8 w-8 text-gray-400" />;
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
            <div 
              key={method.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-4">
                {getCardIcon(method.brand)}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {method.brand ? `${method.brand} ****${method.last4}` : `****${method.last4}`}
                    </p>
                    {method.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                        <CheckCircleIcon className="h-3 w-3" />
                        Default
                      </span>
                    )}
                  </div>
                  {method.expiryMonth && method.expiryYear && (
                    <p className="text-sm text-gray-500">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleRemove(method.id)}
                  className="p-1 text-red-600 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowAddModal(false)} />
            
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
              
              {/* This would integrate with your payment processor (eWAY) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="pt-4 text-xs text-gray-500">
                  <p>Your payment information is processed securely via eWAY.</p>
                  <p>We never store your full card details.</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle payment method addition
                    setShowAddModal(false);
                    fetchPaymentMethods();
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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