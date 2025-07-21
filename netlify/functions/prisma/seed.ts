import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding enhanced subscription plans and features...');

  // Clear existing data
  await prisma.planFeatureMatrix.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.currency.deleteMany();

  // Create currencies
  const currencies = await Promise.all([
    prisma.currency.create({
      data: {
        code: 'AUD',
        name: 'Australian Dollar',
        symbol: '$',
        exchangeRate: 1.0,
        isActive: true,
        isPrimary: true
      }
    }),
    prisma.currency.create({
      data: {
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        exchangeRate: 0.67,
        isActive: true,
        isPrimary: false
      }
    }),
    prisma.currency.create({
      data: {
        code: 'EUR',
        name: 'Euro',
        symbol: '€',
        exchangeRate: 0.61,
        isActive: true,
        isPrimary: false
      }
    })
  ]);

  console.log(`Created ${currencies.length} currencies`);

  // Create feature flags
  const features = await Promise.all([
    prisma.featureFlag.create({
      data: {
        featureName: 'basic_transcription',
        displayName: 'Basic Transcription',
        description: 'Standard audio transcription using Whisper-1',
        category: 'core',
        featureType: 'processing_option',
        minPlanLevel: 1,
        requiredPlans: ['free', 'starter', 'professional', 'team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'advanced_transcription',
        displayName: 'Advanced Transcription',
        description: 'High-accuracy transcription with speaker identification',
        category: 'premium',
        featureType: 'processing_option',
        minPlanLevel: 2,
        requiredPlans: ['professional', 'team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'voice_synthesis',
        displayName: 'Voice Synthesis',
        description: 'Convert text to speech using AI voices',
        category: 'premium',
        featureType: 'processing_option',
        minPlanLevel: 2,
        requiredPlans: ['starter', 'professional', 'team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'real_time_transcription',
        displayName: 'Real-time Transcription',
        description: 'Live audio transcription during recording',
        category: 'premium',
        featureType: 'processing_option',
        minPlanLevel: 3,
        requiredPlans: ['professional', 'team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'api_access',
        displayName: 'API Access',
        description: 'Programmatic access to AudioTricks features',
        category: 'premium',
        featureType: 'api_endpoint',
        minPlanLevel: 3,
        requiredPlans: ['professional', 'team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'webhook_integrations',
        displayName: 'Webhook Integrations',
        description: 'Real-time notifications and integrations',
        category: 'premium',
        featureType: 'integration',
        minPlanLevel: 4,
        requiredPlans: ['team', 'enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    }),
    prisma.featureFlag.create({
      data: {
        featureName: 'sso_integration',
        displayName: 'SSO Integration',
        description: 'Single Sign-On with enterprise identity providers',
        category: 'enterprise',
        featureType: 'integration',
        minPlanLevel: 5,
        requiredPlans: ['enterprise'],
        excludedPlans: [],
        isEnabled: true,
        isBeta: false,
        isDeprecated: false
      }
    })
  ]);

  console.log(`Created ${features.length} feature flags`);

  // Create subscription plans
  const plans = await Promise.all([
    // Free Plan
    prisma.subscriptionPlan.create({
      data: {
        name: 'Free',
        displayName: 'Free Plan',
        description: 'Perfect for getting started with basic audio processing',
        planCode: 'free',
        price: 0,
        currency: 'AUD',
        billingInterval: 'monthly',
        tier: 'personal',
        sortOrder: 1,
        maxApiCalls: 100,
        maxTokens: 10000,
        maxStorageMb: 100,
        maxProcessingMin: 30,
        maxWorkspaces: 1,
        maxUsers: 1,
        maxFileSize: 26214400, // 25MB
        maxTranscriptionsMonthly: 25,
        maxFilesDaily: 3,
        maxFilesMonthly: 50,
        maxConcurrentJobs: 1,
        maxVoiceSynthesisMonthly: 0,
        maxExportOperationsMonthly: 5,
        maxAudioDurationMinutes: 30,
        priorityLevel: 3,
        planCategory: 'personal',
        trialDays: 0,
        features: ['basic_transcription'],
        recommendedFor: ['Students', 'Hobbyists', 'Personal projects'],
        allowedFileTypes: ['mp3', 'wav', 'm4a'],
        analysisFeatures: ['basic_transcription'],
        collaborationFeatures: [],
        integrationFeatures: [],
        isActive: true,
        isPublic: true
      }
    }),
    
    // Starter Plan
    prisma.subscriptionPlan.create({
      data: {
        name: 'Starter',
        displayName: 'Starter Plan',
        description: 'For individuals and small teams getting serious about audio',
        planCode: 'starter_monthly',
        price: 9.99,
        currency: 'AUD',
        billingInterval: 'monthly',
        tier: 'personal',
        sortOrder: 2,
        maxApiCalls: 1000,
        maxTokens: 100000,
        maxStorageMb: 1024,
        maxProcessingMin: 120,
        maxWorkspaces: 2,
        maxUsers: 3,
        maxFileSize: 52428800, // 50MB
        maxTranscriptionsMonthly: 200,
        maxFilesDaily: 10,
        maxFilesMonthly: 300,
        maxConcurrentJobs: 2,
        maxVoiceSynthesisMonthly: 50,
        maxExportOperationsMonthly: 20,
        maxAudioDurationMinutes: 120,
        priorityLevel: 5,
        planCategory: 'personal',
        trialDays: 14,
        features: ['basic_transcription', 'voice_synthesis', 'export_formats'],
        recommendedFor: ['Individual creators', 'Freelancers', 'Small projects'],
        allowedFileTypes: ['mp3', 'wav', 'm4a', 'flac', 'ogg'],
        analysisFeatures: ['basic_transcription', 'voice_synthesis'],
        collaborationFeatures: ['workspace_sharing'],
        integrationFeatures: [],
        isActive: true,
        isPublic: true
      }
    }),
    
    // Professional Plan
    prisma.subscriptionPlan.create({
      data: {
        name: 'Professional',
        displayName: 'Professional Plan',
        description: 'Advanced features for growing businesses and content teams',
        planCode: 'pro_monthly',
        price: 29.99,
        currency: 'AUD',
        billingInterval: 'monthly',
        tier: 'business',
        sortOrder: 3,
        maxApiCalls: 10000,
        maxTokens: 1000000,
        maxStorageMb: 10240,
        maxProcessingMin: 600,
        maxWorkspaces: 5,
        maxUsers: 10,
        maxFileSize: 157286400, // 150MB
        maxTranscriptionsMonthly: 1000,
        maxFilesDaily: 50,
        maxFilesMonthly: 1500,
        maxConcurrentJobs: 5,
        maxVoiceSynthesisMonthly: 300,
        maxExportOperationsMonthly: 100,
        maxAudioDurationMinutes: 480,
        priorityLevel: 7,
        planCategory: 'business',
        trialDays: 30,
        features: ['advanced_transcription', 'voice_synthesis', 'speaker_identification', 'api_access'],
        recommendedFor: ['Growing businesses', 'Content teams', 'Marketing agencies'],
        allowedFileTypes: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'aac'],
        analysisFeatures: ['advanced_transcription', 'voice_synthesis', 'speaker_identification', 'sentiment_analysis'],
        collaborationFeatures: ['team_workspaces', 'user_management', 'role_permissions'],
        integrationFeatures: ['api_access', 'zapier_integration'],
        isActive: true,
        isPublic: true
      }
    }),
    
    // Team Plan
    prisma.subscriptionPlan.create({
      data: {
        name: 'Team',
        displayName: 'Team Plan',
        description: 'Everything teams need for collaborative audio processing',
        planCode: 'team_monthly',
        price: 79.99,
        currency: 'AUD',
        billingInterval: 'monthly',
        tier: 'business',
        sortOrder: 4,
        maxApiCalls: 50000,
        maxTokens: 5000000,
        maxStorageMb: 51200,
        maxProcessingMin: 3000,
        maxWorkspaces: 15,
        maxUsers: 50,
        maxFileSize: 524288000, // 500MB
        maxTranscriptionsMonthly: 5000,
        maxFilesDaily: 200,
        maxFilesMonthly: 6000,
        maxConcurrentJobs: 10,
        maxVoiceSynthesisMonthly: 1000,
        maxExportOperationsMonthly: 500,
        maxAudioDurationMinutes: 0, // Unlimited
        priorityLevel: 8,
        planCategory: 'business',
        trialDays: 30,
        features: ['advanced_transcription', 'real_time_transcription', 'api_access', 'webhook_integrations'],
        recommendedFor: ['Large teams', 'Departments', 'Media companies'],
        allowedFileTypes: ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'opus', 'aac', 'wma'],
        analysisFeatures: ['advanced_transcription', 'voice_synthesis', 'real_time_transcription', 'custom_vocabulary', 'advanced_analytics'],
        collaborationFeatures: ['advanced_team_features', 'project_management', 'approval_workflows'],
        integrationFeatures: ['full_api_access', 'webhook_integrations', 'sso_basic'],
        isActive: true,
        isPublic: true
      }
    }),
    
    // Enterprise Plan
    prisma.subscriptionPlan.create({
      data: {
        name: 'Enterprise',
        displayName: 'Enterprise Plan',
        description: 'Custom solutions for large organizations with unlimited scale',
        planCode: 'enterprise_monthly',
        price: 299.99,
        currency: 'AUD',
        billingInterval: 'monthly',
        tier: 'enterprise',
        sortOrder: 5,
        maxApiCalls: 999999999, // Effectively unlimited
        maxTokens: 999999999, // Effectively unlimited  
        maxStorageMb: 999999999, // Effectively unlimited
        maxProcessingMin: 999999999, // Effectively unlimited
        maxWorkspaces: 999999, // Effectively unlimited
        maxUsers: 999999, // Effectively unlimited
        maxFileSize: 999999999999, // Effectively unlimited
        maxTranscriptionsMonthly: 999999999, // Effectively unlimited
        maxFilesDaily: 999999, // Effectively unlimited
        maxFilesMonthly: 999999999, // Effectively unlimited
        maxConcurrentJobs: 50,
        maxVoiceSynthesisMonthly: 999999999, // Effectively unlimited
        maxExportOperationsMonthly: 999999999, // Effectively unlimited
        maxAudioDurationMinutes: 0, // Unlimited
        priorityLevel: 10,
        planCategory: 'enterprise',
        trialDays: 60,
        features: ['all_features', 'custom_models', 'sso_integration', 'priority_support'],
        recommendedFor: ['Large enterprises', 'Government', 'Educational institutions'],
        allowedFileTypes: ['all_supported_formats'],
        analysisFeatures: ['all_features', 'custom_models', 'ai_insights'],
        collaborationFeatures: ['enterprise_collaboration', 'advanced_security', 'compliance_features'],
        integrationFeatures: ['enterprise_api', 'custom_integrations', 'sso_enterprise', 'white_label'],
        isActive: true,
        isPublic: true
      }
    })
  ]);

  console.log(`Created ${plans.length} subscription plans`);

  // Create plan pricing for different currencies
  const planPricingData = [];
  for (const plan of plans) {
    // AUD pricing (base)
    planPricingData.push({
      planId: plan.id,
      currency: 'AUD',
      price: plan.price,
      billingPeriod: 'monthly',
      isActive: true
    });

    // USD pricing
    const usdPrice = Math.round(Number(plan.price) * 0.67 * 100) / 100;
    planPricingData.push({
      planId: plan.id,
      currency: 'USD',
      price: usdPrice,
      billingPeriod: 'monthly',
      isActive: true
    });

    // EUR pricing  
    const eurPrice = Math.round(Number(plan.price) * 0.61 * 100) / 100;
    planPricingData.push({
      planId: plan.id,
      currency: 'EUR',
      price: eurPrice,
      billingPeriod: 'monthly',
      isActive: true
    });

    // Yearly pricing (10% discount)
    if (Number(plan.price) > 0) {
      const yearlyAudPrice = Math.round(Number(plan.price) * 12 * 0.9 * 100) / 100;
      const yearlyUsdPrice = Math.round(yearlyAudPrice * 0.67 * 100) / 100;
      const yearlyEurPrice = Math.round(yearlyAudPrice * 0.61 * 100) / 100;

      planPricingData.push(
        {
          planId: plan.id,
          currency: 'AUD',
          price: yearlyAudPrice,
          billingPeriod: 'yearly',
          isActive: true
        },
        {
          planId: plan.id,
          currency: 'USD', 
          price: yearlyUsdPrice,
          billingPeriod: 'yearly',
          isActive: true
        },
        {
          planId: plan.id,
          currency: 'EUR',
          price: yearlyEurPrice,
          billingPeriod: 'yearly',
          isActive: true
        }
      );
    }
  }

  await prisma.planPricing.createMany({
    data: planPricingData
  });

  console.log(`Created ${planPricingData.length} plan pricing entries`);

  // Create plan feature matrix
  const planFeatureMatrix = [];
  for (const plan of plans) {
    for (const feature of features) {
      const planTier = plan.tier;
      const featureLevel = feature.minPlanLevel;
      let isEnabled = false;

      // Determine if feature is enabled for this plan
      if (planTier === 'personal' && featureLevel <= 2) isEnabled = true;
      if (planTier === 'business' && featureLevel <= 4) isEnabled = true;
      if (planTier === 'enterprise') isEnabled = true;

      // Override for specific features
      if (feature.requiredPlans.includes(plan.planCode)) isEnabled = true;
      if (feature.excludedPlans.includes(plan.planCode)) isEnabled = false;

      planFeatureMatrix.push({
        planId: plan.id,
        featureFlagId: feature.id,
        isEnabled,
        usageLimit: null,
        includedUsage: 0,
        overageRate: null
      });
    }
  }

  await prisma.planFeatureMatrix.createMany({
    data: planFeatureMatrix
  });

  console.log(`Created ${planFeatureMatrix.length} plan feature matrix entries`);

  console.log('✅ Enhanced subscription plans seeding completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });