/**
 * Pricing page with subscription plans
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

interface PricingPlan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billingInterval: string;
  features: string[];
  maxTranscriptionsMonthly: number;
  maxStorageMb: number;
  maxUsers: number;
  isPopular?: boolean;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      // Mock data for now - replace with API call
      const mockPlans: PricingPlan[] = [
        {
          id: 'free',
          name: 'free',
          displayName: 'Free Forever',
          price: 0,
          currency: 'USD',
          billingInterval: 'monthly',
          features: [
            '10 audio files per month',
            'Basic transcription',
            'Standard summaries',
            '1GB storage',
            'Email support'
          ],
          maxTranscriptionsMonthly: 10,
          maxStorageMb: 1024,
          maxUsers: 1
        },
        {
          id: 'pro',
          name: 'pro',
          displayName: 'Professional',
          price: 10,
          currency: 'USD',
          billingInterval: 'monthly',
          features: [
            '100 audio files per month',
            'Advanced transcription',
            'AI-powered summaries',
            'Speaker identification',
            '10GB storage',
            'Priority support',
            'Export to multiple formats',
            'Team collaboration'
          ],
          maxTranscriptionsMonthly: 100,
          maxStorageMb: 10240,
          maxUsers: 5,
          isPopular: true
        },
        {
          id: 'enterprise',
          name: 'enterprise',
          displayName: 'Enterprise',
          price: 49,
          currency: 'USD',
          billingInterval: 'monthly',
          features: [
            'Unlimited audio files',
            'Premium transcription',
            'Custom AI models',
            'Advanced analytics',
            'Unlimited storage',
            'Dedicated support',
            'API access',
            'Custom integrations',
            'SSO authentication',
            'SLA guarantee'
          ],
          maxTranscriptionsMonthly: -1,
          maxStorageMb: -1,
          maxUsers: -1
        }
      ];
      
      setPlans(mockPlans);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: PricingPlan) => {
    if (plan.price === 0) {
      // Free plan - redirect to signup
      navigate('/admin/login');
    } else {
      // Paid plan - redirect to signup with plan selection
      navigate(`/admin/login?plan=${plan.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with our free plan or unlock advanced features with our premium options.
            All plans include our core transcription technology.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                plan.isPopular ? 'ring-2 ring-blue-600' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm font-medium rounded-bl-lg">
                  Most Popular
                </div>
              )}

              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.displayName}
                </h3>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 ml-2">
                    / {plan.billingInterval}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="ml-3 text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    plan.isPopular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : plan.price === 0
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.price === 0 ? 'Get Your Free Account' : 'Get Started'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          
          <div className="max-w-3xl mx-auto text-left space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards through our secure payment processor.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Our free plan lets you test all core features. Upgrade when you need more capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}