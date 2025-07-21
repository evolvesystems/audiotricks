#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseStatus() {
  console.log('🔍 Checking database status...\n');

  try {
    // Check connection
    await prisma.$connect();
    console.log('✅ Database connection successful\n');

    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    ` as Array<{ table_name: string }>;

    console.log(`📊 Found ${tables.length} tables:`);
    tables.forEach(t => console.log(`  - ${t.table_name}`));

    // Check for new vs existing tables
    const expectedTables = [
      'users', 'sessions', 'refresh_tokens', 'workspaces', 'workspace_users',
      'workspace_invitations', 'user_settings', 'audio_history',
      // New tables
      'subscription_plans', 'workspace_subscriptions', 'billing_records',
      'payment_methods', 'api_key_management', 'api_key_usage_logs',
      'audio_uploads', 'processing_jobs', 'audio_segments', 'audio_chunks',
      'storage_providers', 'file_storage', 'usage_metrics', 'user_quotas',
      'storage_quotas', 'usage_records', 'audit_logs', 'security_events',
      'notifications', 'email_templates', 'email_logs', 'email_preferences',
      'integrations', 'workspace_automations', 'webhooks', 'custom_fields',
      'tags', 'ai_agents', 'ai_conversations', 'ai_messages', 'ai_token_usage',
      'system_config', 'health_checks'
    ];

    const existingTableNames = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));
    const extraTables = existingTableNames.filter(t => 
      !expectedTables.includes(t) && !t.startsWith('_prisma')
    );

    console.log(`\n📋 Schema Analysis:`);
    console.log(`  Expected tables: ${expectedTables.length}`);
    console.log(`  Existing tables: ${existingTableNames.length}`);
    console.log(`  Missing tables: ${missingTables.length}`);
    
    if (missingTables.length > 0) {
      console.log(`\n❌ Missing tables (${missingTables.length}):`);
      missingTables.forEach(t => console.log(`  - ${t}`));
    }

    if (extraTables.length > 0) {
      console.log(`\n⚠️  Extra tables (${extraTables.length}):`);
      extraTables.forEach(t => console.log(`  - ${t}`));
    }

    // Check specific table counts
    console.log('\n📈 Table Statistics:');
    
    const counts = {
      users: await prisma.user.count(),
      workspaces: await prisma.workspace.count(),
      audioHistory: await prisma.audioHistory.count(),
    };

    for (const [table, count] of Object.entries(counts)) {
      console.log(`  ${table}: ${count} records`);
    }

    // Check if subscription plans exist
    try {
      const planCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM subscription_plans
      ` as Array<{ count: bigint }>;
      console.log(`  subscription_plans: ${planCount[0].count} records`);
    } catch (error) {
      console.log(`  subscription_plans: table not found`);
    }

    // Migration status
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at 
      FROM _prisma_migrations 
      ORDER BY finished_at DESC 
      LIMIT 5
    ` as Array<{ migration_name: string; finished_at: Date | null }>;

    console.log('\n🔄 Recent Migrations:');
    migrations.forEach(m => {
      const status = m.finished_at ? '✅' : '⏳';
      const date = m.finished_at ? m.finished_at.toISOString().split('T')[0] : 'pending';
      console.log(`  ${status} ${m.migration_name} (${date})`);
    });

    // Recommendation
    console.log('\n💡 Recommendation:');
    if (missingTables.length > 0) {
      console.log('  ⚠️  Database schema needs to be updated');
      console.log('  Run: npx prisma migrate deploy');
    } else {
      console.log('  ✅ Database schema is up to date');
      
      // Check if we need to seed data
      try {
        const planCount = await prisma.subscriptionPlan.count();
        if (planCount === 0) {
          console.log('  💡 Run: npx tsx scripts/seed-subscription-plans.ts');
        }
      } catch (error) {
        // Ignore if table doesn't exist
      }
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    if (error.code === 'P2021') {
      console.log('\n💡 The table does not exist in the current database.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseStatus();