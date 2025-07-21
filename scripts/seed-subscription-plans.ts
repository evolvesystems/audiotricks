#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSubscriptionPlans() {
  console.log('🌱 Seeding subscription plans...\n');

  const plans = [
    {
      name: 'free',
      displayName: 'Free',
      description: 'Perfect for trying out AudioTricks',
      tier: 'free',
      price: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: {
        audioMinutes: 60,
        storageGB: 1,
        maxFileSize: 25,
        transcriptionAccuracy: 'standard',
        summaryQuality: 'basic',
        maxWorkspaces: 1,
        maxUsersPerWorkspace: 1,
        exportFormats: ['txt', 'srt'],
        apiAccess: false,
        prioritySupport: false,
        customIntegrations: false
      },
      quotas: {
        audioMinutesPerMonth: 60,
        storageGB: 1,
        apiCallsPerDay: 100,
        maxUploadSizeMB: 25
      },
      sortOrder: 1
    },
    {
      name: 'pro',
      displayName: 'Pro',
      description: 'For professionals and small teams',
      tier: 'pro',
      price: 29.99,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: {
        audioMinutes: 600,
        storageGB: 10,
        maxFileSize: 100,
        transcriptionAccuracy: 'enhanced',
        summaryQuality: 'advanced',
        maxWorkspaces: 5,
        maxUsersPerWorkspace: 10,
        exportFormats: ['txt', 'srt', 'vtt', 'json', 'docx'],
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: false,
        advancedAnalytics: true,
        speakerIdentification: true,
        customVocabulary: true
      },
      quotas: {
        audioMinutesPerMonth: 600,
        storageGB: 10,
        apiCallsPerDay: 1000,
        maxUploadSizeMB: 100
      },
      trialDays: 14,
      sortOrder: 2
    },
    {
      name: 'pro_yearly',
      displayName: 'Pro (Annual)',
      description: 'Pro plan with 20% discount when paid annually',
      tier: 'pro',
      price: 287.90, // 20% discount
      currency: 'USD',
      billingPeriod: 'yearly',
      features: {
        audioMinutes: 7200, // 600 * 12
        storageGB: 10,
        maxFileSize: 100,
        transcriptionAccuracy: 'enhanced',
        summaryQuality: 'advanced',
        maxWorkspaces: 5,
        maxUsersPerWorkspace: 10,
        exportFormats: ['txt', 'srt', 'vtt', 'json', 'docx'],
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: false,
        advancedAnalytics: true,
        speakerIdentification: true,
        customVocabulary: true
      },
      quotas: {
        audioMinutesPerMonth: 600,
        storageGB: 10,
        apiCallsPerDay: 1000,
        maxUploadSizeMB: 100
      },
      trialDays: 14,
      sortOrder: 3
    },
    {
      name: 'enterprise',
      displayName: 'Enterprise',
      description: 'For large organizations with advanced needs',
      tier: 'enterprise',
      price: 99.99,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: {
        audioMinutes: 'unlimited',
        storageGB: 100,
        maxFileSize: 500,
        transcriptionAccuracy: 'premium',
        summaryQuality: 'premium',
        maxWorkspaces: 'unlimited',
        maxUsersPerWorkspace: 'unlimited',
        exportFormats: ['txt', 'srt', 'vtt', 'json', 'docx', 'pdf', 'csv'],
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        advancedAnalytics: true,
        speakerIdentification: true,
        customVocabulary: true,
        sla: true,
        dedicatedAccountManager: true,
        customBranding: true,
        ssoIntegration: true,
        auditLogs: true,
        roleBasedAccess: true
      },
      quotas: {
        audioMinutesPerMonth: -1, // unlimited
        storageGB: 100,
        apiCallsPerDay: -1, // unlimited
        maxUploadSizeMB: 500
      },
      sortOrder: 4
    },
    {
      name: 'enterprise_yearly',
      displayName: 'Enterprise (Annual)',
      description: 'Enterprise plan with 25% discount when paid annually',
      tier: 'enterprise',
      price: 899.91, // 25% discount
      currency: 'USD',
      billingPeriod: 'yearly',
      features: {
        audioMinutes: 'unlimited',
        storageGB: 100,
        maxFileSize: 500,
        transcriptionAccuracy: 'premium',
        summaryQuality: 'premium',
        maxWorkspaces: 'unlimited',
        maxUsersPerWorkspace: 'unlimited',
        exportFormats: ['txt', 'srt', 'vtt', 'json', 'docx', 'pdf', 'csv'],
        apiAccess: true,
        prioritySupport: true,
        customIntegrations: true,
        advancedAnalytics: true,
        speakerIdentification: true,
        customVocabulary: true,
        sla: true,
        dedicatedAccountManager: true,
        customBranding: true,
        ssoIntegration: true,
        auditLogs: true,
        roleBasedAccess: true
      },
      quotas: {
        audioMinutesPerMonth: -1, // unlimited
        storageGB: 100,
        apiCallsPerDay: -1, // unlimited
        maxUploadSizeMB: 500
      },
      sortOrder: 5
    }
  ];

  try {
    // Check if plans already exist
    const existingPlans = await prisma.subscriptionPlan.count();
    if (existingPlans > 0) {
      console.log(`⚠️  Subscription plans already exist (${existingPlans} plans found)`);
      const overwrite = process.argv.includes('--force');
      
      if (!overwrite) {
        console.log('Use --force flag to overwrite existing plans');
        return;
      }
      
      console.log('🗑️  Removing existing plans...');
      await prisma.subscriptionPlan.deleteMany();
    }

    // Create plans
    for (const plan of plans) {
      const created = await prisma.subscriptionPlan.create({
        data: plan
      });
      
      console.log(`✅ Created ${plan.tier} plan: ${plan.displayName} - $${plan.price}/${plan.billingPeriod}`);
    }

    // Verify creation
    const totalPlans = await prisma.subscriptionPlan.count();
    console.log(`\n✅ Successfully created ${totalPlans} subscription plans`);

    // Display plans
    const allPlans = await prisma.subscriptionPlan.findMany({
      orderBy: { sortOrder: 'asc' }
    });

    console.log('\n📋 Available Plans:');
    console.log('=====================================');
    for (const plan of allPlans) {
      console.log(`${plan.displayName} (${plan.name})`);
      console.log(`  Price: $${plan.price}/${plan.billingPeriod}`);
      console.log(`  Tier: ${plan.tier}`);
      if (plan.trialDays > 0) {
        console.log(`  Trial: ${plan.trialDays} days`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error seeding subscription plans:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedSubscriptionPlans()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });