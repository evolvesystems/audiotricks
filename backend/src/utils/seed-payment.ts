import { PrismaClient } from '@prisma/client';
import { CurrencyService } from '../services/currency/currency.service';
// import { logger } from './logger'; // Removed unused import

const prisma = new PrismaClient();

/**
 * Seed payment data including subscription plans, currencies, and pricing
 */
async function seedPaymentData() {
  try {
    console.log('🎵 AudioTricks - Seeding Payment Data...');

    // Initialize currency service and currencies
    const currencyService = new CurrencyService(prisma);
    await currencyService.initializeCurrencies();
    console.log('✅ Currencies initialized');

    // Create subscription plans
    const plans = [
      {
        name: 'free',
        displayName: 'Free Plan',
        description: 'Perfect for trying out AudioTricks with basic features',
        tier: 'free',
        price: 0,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          transcription: true,
          summarization: true,
          basicAnalysis: true,
          export: ['txt', 'json'],
          apiAccess: false,
          prioritySupport: false,
          customIntegrations: false,
          teamWorkspaces: false,
          advancedAnalytics: false,
          customBranding: false
        },
        quotas: {
          storage_gb: 1,
          processing_minutes: 60,
          api_calls_per_month: 1000,
          transcription_minutes: 30,
          ai_tokens_per_month: 50000,
          workspaces: 1,
          team_members: 1
        },
        trialDays: 0,
        sortOrder: 1
      },
      {
        name: 'pro',
        displayName: 'Pro Plan',
        description: 'Advanced features for professionals and small teams',
        tier: 'pro',
        price: 29,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          transcription: true,
          summarization: true,
          basicAnalysis: true,
          advancedAnalysis: true,
          export: ['txt', 'json', 'csv', 'docx', 'pdf'],
          apiAccess: true,
          prioritySupport: true,
          customIntegrations: true,
          teamWorkspaces: true,
          advancedAnalytics: true,
          customBranding: false,
          speakerIdentification: true,
          sentimentAnalysis: true,
          keywordExtraction: true,
          automatedSummaries: true
        },
        quotas: {
          storage_gb: 50,
          processing_minutes: 600,
          api_calls_per_month: 10000,
          transcription_minutes: 300,
          ai_tokens_per_month: 500000,
          workspaces: 3,
          team_members: 10
        },
        trialDays: 14,
        sortOrder: 2
      },
      {
        name: 'enterprise',
        displayName: 'Enterprise Plan',
        description: 'Full-scale solution for large organizations',
        tier: 'enterprise',
        price: 99,
        currency: 'USD',
        billingPeriod: 'monthly',
        features: {
          transcription: true,
          summarization: true,
          basicAnalysis: true,
          advancedAnalysis: true,
          export: ['txt', 'json', 'csv', 'docx', 'pdf', 'srt', 'vtt'],
          apiAccess: true,
          prioritySupport: true,
          customIntegrations: true,
          teamWorkspaces: true,
          advancedAnalytics: true,
          customBranding: true,
          speakerIdentification: true,
          sentimentAnalysis: true,
          keywordExtraction: true,
          automatedSummaries: true,
          customAiModels: true,
          ssoIntegration: true,
          auditLogs: true,
          dataRetention: true,
          dedicatedSupport: true
        },
        quotas: {
          storage_gb: 500,
          processing_minutes: 6000,
          api_calls_per_month: 100000,
          transcription_minutes: 3000,
          ai_tokens_per_month: 5000000,
          workspaces: 10,
          team_members: 100
        },
        trialDays: 30,
        sortOrder: 3
      }
    ];

    // Create yearly variants
    const yearlyPlans = [
      {
        ...plans[1], // Pro
        name: 'pro-yearly',
        displayName: 'Pro Plan (Yearly)',
        price: 290, // 12 months for the price of 10
        billingPeriod: 'yearly',
        sortOrder: 4
      },
      {
        ...plans[2], // Enterprise
        name: 'enterprise-yearly',
        displayName: 'Enterprise Plan (Yearly)',
        price: 990, // 12 months for the price of 10
        billingPeriod: 'yearly',
        sortOrder: 5
      }
    ];

    const allPlans = [...plans, ...yearlyPlans];

    // Create plans and pricing for multiple currencies
    const currencies = ['USD', 'EUR', 'GBP', 'AUD', 'CAD'];
    
    for (const planData of allPlans) {
      // Create the plan
      const plan = await prisma.subscriptionPlan.upsert({
        where: { name: planData.name },
        update: {
          displayName: planData.displayName,
          description: planData.description,
          tier: planData.tier,
          price: planData.price,
          currency: planData.currency,
          billingPeriod: planData.billingPeriod,
          features: planData.features,
          quotas: planData.quotas,
          trialDays: planData.trialDays,
          sortOrder: planData.sortOrder
        },
        create: {
          name: planData.name,
          displayName: planData.displayName,
          description: planData.description,
          tier: planData.tier,
          price: planData.price,
          currency: planData.currency,
          billingPeriod: planData.billingPeriod,
          features: planData.features,
          quotas: planData.quotas,
          trialDays: planData.trialDays,
          sortOrder: planData.sortOrder,
          isActive: true,
          isPublic: true
        }
      });

      // Create pricing for different currencies
      for (const currency of currencies) {
        if (planData.price > 0) { // Skip free plan
          const conversion = await currencyService.convertCurrency(
            planData.price,
            'USD',
            currency
          );

          await prisma.planPricing.upsert({
            where: {
              planId_currency_interval: {
                planId: plan.id,
                currency,
                interval: planData.billingPeriod
              }
            },
            update: {
              price: conversion.convertedAmount
            },
            create: {
              planId: plan.id,
              currency,
              price: conversion.convertedAmount,
              interval: planData.billingPeriod,
              isActive: true
            }
          });
        }
      }

      console.log(`✅ Created plan: ${planData.displayName}`);
    }

    // Create payment gateway configurations
    await prisma.paymentGatewayConfig.upsert({
      where: { 
        provider_environment: {
          provider: 'stripe',
          environment: 'production'
        }
      },
      update: {
        config: {
          supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'],
          supportedCountries: ['US', 'CA', 'GB', 'AU', 'NZ', 'JP', 'CH', 'SE', 'NO', 'DK', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'FI', 'IE'],
          webhookEndpoint: '/api/payment/webhooks/stripe'
        }
      },
      create: {
        provider: 'stripe',
        environment: 'production',
        isActive: true,
        config: {
          supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK'],
          supportedCountries: ['US', 'CA', 'GB', 'AU', 'NZ', 'JP', 'CH', 'SE', 'NO', 'DK', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'FI', 'IE'],
          webhookEndpoint: '/api/payment/webhooks/stripe'
        }
      }
    });

    await prisma.paymentGatewayConfig.upsert({
      where: { 
        provider_environment: {
          provider: 'eway',
          environment: 'production'
        }
      },
      update: {
        config: {
          supportedCurrencies: ['AUD', 'USD', 'NZD'],
          supportedCountries: ['AU', 'NZ']
        }
      },
      create: {
        provider: 'eway',
        environment: 'production',
        isActive: false,
        config: {
          supportedCurrencies: ['AUD', 'USD', 'NZD'],
          supportedCountries: ['AU', 'NZ'],
          webhookEndpoint: '/api/payment/webhooks/eway'
        }
      }
    });

    console.log('✅ Payment gateway configurations created');

    console.log('🎉 Payment data seeding completed successfully!');
    console.log('\nCreated plans:');
    console.log('- Free Plan (USD $0/month)');
    console.log('- Pro Plan (USD $29/month, $290/year)');
    console.log('- Enterprise Plan (USD $99/month, $990/year)');
    console.log('\nSupported currencies: USD, EUR, GBP, AUD, CAD, JPY, CHF, SEK, NOK, DKK');
    console.log('Primary payment gateway: Stripe');

  } catch (error) {
    console.error('❌ Error seeding payment data:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await seedPaymentData();
  } catch (error) {
    console.error('Failed to seed payment data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedPaymentData };