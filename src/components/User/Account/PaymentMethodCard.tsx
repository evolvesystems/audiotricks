/**
 * Payment Method Card - Individual payment method display
 */

import React from 'react';
import { 
  CreditCardIcon,
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

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (methodId: string) => void;
  onRemove: (methodId: string) => void;
}

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onRemove
}: PaymentMethodCardProps) {
  const getCardIcon = (brand?: string) => {
    // In a real app, you'd have specific icons for each card brand
    return <CreditCardIcon className="h-8 w-8 text-gray-400" />;
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
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
            onClick={() => onSetDefault(method.id)}
            className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Set as Default
          </button>
        )}
        <button
          onClick={() => onRemove(method.id)}
          className="p-1 text-red-600 hover:text-red-700"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}