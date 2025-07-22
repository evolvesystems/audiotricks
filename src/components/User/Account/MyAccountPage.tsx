/**
 * My Account Page
 * User account management including subscription and payments
 */

import React, { useState, useEffect } from 'react';
import { logger } from '../../../utils/logger';
import { 
  CreditCardIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import SubscriptionSection from './SubscriptionSection';
import PaymentMethodsSection from './PaymentMethodsSection';
import BillingHistorySection from './BillingHistorySection';
import ProfileSection from './ProfileSection';

type TabType = 'profile' | 'subscription' | 'payment' | 'billing';

interface TabConfig {
  id: TabType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'profile', name: 'Profile', icon: UserCircleIcon },
  { id: 'subscription', name: 'Subscription', icon: CreditCardIcon },
  { id: 'payment', name: 'Payment Methods', icon: CreditCardIcon },
  { id: 'billing', name: 'Billing History', icon: DocumentTextIcon }
];

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function MyAccountPage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    fetchAccountData();
  }, []);

  const fetchAccountData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch user profile
      const profileResponse = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setUserProfile(profileData);
      }

      // Fetch subscription
      const subResponse = await fetch('/api/user/subscription', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subResponse.ok) {
        const subData = await subResponse.json();
        setSubscription(subData);
      }
    } catch (error) {
      logger.error('Error fetching account data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading account information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        <p className="text-gray-600 mt-2">
          Manage your profile, subscription, and billing information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'profile' && (
          <ProfileSection 
            profile={userProfile} 
            onUpdate={fetchAccountData}
          />
        )}
        
        {activeTab === 'subscription' && (
          <SubscriptionSection 
            subscription={subscription}
            onUpdate={fetchAccountData}
          />
        )}
        
        {activeTab === 'payment' && (
          <PaymentMethodsSection 
            onUpdate={fetchAccountData}
          />
        )}
        
        {activeTab === 'billing' && (
          <BillingHistorySection />
        )}
      </div>
    </div>
  );
}