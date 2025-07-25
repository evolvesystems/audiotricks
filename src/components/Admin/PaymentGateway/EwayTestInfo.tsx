/**
 * eWAY Test Info - Display test credentials and card information
 */

import React from 'react';

interface EwayTestInfoProps {
  environment: 'sandbox' | 'production';
}

export default function EwayTestInfo({ environment }: EwayTestInfoProps) {
  if (environment !== 'sandbox') {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
      <h3 className="text-sm font-medium text-blue-800 mb-2">Test Credentials</h3>
      <p className="text-sm text-blue-700 mb-2">
        To get test credentials:
      </p>
      <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
        <li>Sign up for an eWAY sandbox account at developers.eway.com.au</li>
        <li>Log in to your sandbox account</li>
        <li>Navigate to API Keys section</li>
        <li>Copy your Rapid API Key and Password</li>
      </ol>
      <div className="mt-3 p-3 bg-white rounded border border-blue-200">
        <p className="text-sm font-medium text-gray-700 mb-1">Test Card Numbers:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Visa: 4444333322221111</li>
          <li>• MasterCard: 5123456789012346</li>
          <li>• CVN: 123 (any 3 digits)</li>
          <li>• Expiry: Any future date</li>
        </ul>
      </div>
    </div>
  );
}