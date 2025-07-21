#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface MigrationStep {
  name: string;
  description: string;
  run: () => Promise<void>;
  rollback?: () => Promise<void>;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

class SchemaMigrator {
  private steps: MigrationStep[] = [];
  private completedSteps: string[] = [];

  constructor() {
    this.defineSteps();
  }

  private defineSteps() {
    this.steps = [
      {
        name: 'backup-database',
        description: 'Create database backup',
        run: async () => {
          console.log('📦 Creating database backup...');
          const timestamp = new Date().toISOString().replace(/:/g, '-');
          const backupFile = `backup-${timestamp}.sql`;
          
          try {
            execSync(`pg_dump ${process.env.DATABASE_URL} > ${backupFile}`);
            console.log(`✅ Backup created: ${backupFile}`);
          } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
          }
        }
      },
      {
        name: 'copy-enhanced-schema',
        description: 'Replace schema.prisma with enhanced version',
        run: async () => {
          console.log('📝 Updating schema file...');
          const sourcePath = path.join(__dirname, '../prisma/schema.enhanced.prisma');
          const targetPath = path.join(__dirname, '../prisma/schema.prisma');
          const backupPath = path.join(__dirname, '../prisma/schema.backup.prisma');
          
          // Backup current schema
          fs.copyFileSync(targetPath, backupPath);
          console.log('✅ Current schema backed up');
          
          // Copy enhanced schema
          fs.copyFileSync(sourcePath, targetPath);
          console.log('✅ Enhanced schema copied');
        },
        rollback: async () => {
          const targetPath = path.join(__dirname, '../prisma/schema.prisma');
          const backupPath = path.join(__dirname, '../prisma/schema.backup.prisma');
          fs.copyFileSync(backupPath, targetPath);
          console.log('✅ Schema rolled back');
        }
      },
      {
        name: 'generate-migration',
        description: 'Generate Prisma migration',
        run: async () => {
          console.log('🔄 Generating migration...');
          try {
            execSync('npx prisma migrate dev --name enhanced_schema --create-only', {
              stdio: 'inherit'
            });
            console.log('✅ Migration generated');
          } catch (error) {
            console.error('❌ Migration generation failed:', error);
            throw error;
          }
        }
      },
      {
        name: 'migrate-user-data',
        description: 'Migrate existing user data',
        run: async () => {
          console.log('👤 Migrating user data...');
          
          // Add default values for new user fields
          const users = await prisma.user.findMany();
          console.log(`Found ${users.length} users to migrate`);
          
          for (const user of users) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                firstName: user.username,
                emailVerified: true,
                emailVerifiedAt: user.createdAt
              }
            });
          }
          
          console.log('✅ User data migrated');
        }
      },
      {
        name: 'create-subscription-plans',
        description: 'Create default subscription plans',
        run: async () => {
          console.log('💳 Creating subscription plans...');
          
          const plans = [
            {
              name: 'free',
              displayName: 'Free',
              description: 'Perfect for trying out AudioTricks',
              tier: 'free',
              price: 0,
              billingPeriod: 'monthly',
              features: {
                audioMinutes: 60,
                storageGB: 1,
                maxFileSize: 25,
                transcriptionAccuracy: 'standard',
                summaryQuality: 'basic'
              },
              quotas: {
                audioMinutesPerMonth: 60,
                storageGB: 1,
                apiCallsPerDay: 100
              }
            },
            {
              name: 'pro',
              displayName: 'Pro',
              description: 'For professionals and small teams',
              tier: 'pro',
              price: 29.99,
              billingPeriod: 'monthly',
              features: {
                audioMinutes: 600,
                storageGB: 10,
                maxFileSize: 100,
                transcriptionAccuracy: 'enhanced',
                summaryQuality: 'advanced',
                apiAccess: true,
                prioritySupport: true
              },
              quotas: {
                audioMinutesPerMonth: 600,
                storageGB: 10,
                apiCallsPerDay: 1000
              }
            },
            {
              name: 'enterprise',
              displayName: 'Enterprise',
              description: 'For large organizations',
              tier: 'enterprise',
              price: 99.99,
              billingPeriod: 'monthly',
              features: {
                audioMinutes: 'unlimited',
                storageGB: 100,
                maxFileSize: 500,
                transcriptionAccuracy: 'premium',
                summaryQuality: 'premium',
                apiAccess: true,
                prioritySupport: true,
                customIntegrations: true,
                sla: true
              },
              quotas: {
                audioMinutesPerMonth: -1, // unlimited
                storageGB: 100,
                apiCallsPerDay: -1 // unlimited
              }
            }
          ];
          
          for (const plan of plans) {
            await prisma.subscriptionPlan.create({
              data: plan
            });
          }
          
          console.log('✅ Subscription plans created');
        }
      },
      {
        name: 'assign-free-plans',
        description: 'Assign free plan to existing workspaces',
        run: async () => {
          console.log('🎁 Assigning free plans...');
          
          const freePlan = await prisma.subscriptionPlan.findUnique({
            where: { name: 'free' }
          });
          
          if (!freePlan) {
            throw new Error('Free plan not found');
          }
          
          const workspaces = await prisma.workspace.findMany({
            include: { subscriptions: true }
          });
          
          for (const workspace of workspaces) {
            if (!workspace.subscriptions.length) {
              await prisma.workspaceSubscription.create({
                data: {
                  workspaceId: workspace.id,
                  planId: freePlan.id,
                  status: 'active',
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                }
              });
            }
          }
          
          console.log('✅ Free plans assigned');
        }
      },
      {
        name: 'create-api-key-entries',
        description: 'Migrate existing API keys',
        run: async () => {
          console.log('🔑 Migrating API keys...');
          
          const userSettings = await prisma.userSettings.findMany();
          
          for (const settings of userSettings) {
            if (settings.openaiApiKeyEncrypted) {
              await prisma.apiKeyManagement.create({
                data: {
                  userId: settings.userId,
                  provider: 'openai',
                  keyHash: 'migration-hash-' + settings.userId,
                  keyPrefix: 'sk-****',
                  encryptedKey: settings.openaiApiKeyEncrypted,
                  isActive: true
                }
              });
            }
            
            if (settings.elevenlabsApiKeyEncrypted) {
              await prisma.apiKeyManagement.create({
                data: {
                  userId: settings.userId,
                  provider: 'elevenlabs',
                  keyHash: 'migration-hash-el-' + settings.userId,
                  keyPrefix: 'el-****',
                  encryptedKey: settings.elevenlabsApiKeyEncrypted,
                  isActive: true
                }
              });
            }
          }
          
          console.log('✅ API keys migrated');
        }
      },
      {
        name: 'apply-migration',
        description: 'Apply the migration to database',
        run: async () => {
          console.log('🚀 Applying migration...');
          try {
            execSync('npx prisma migrate deploy', {
              stdio: 'inherit'
            });
            console.log('✅ Migration applied');
          } catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
          }
        }
      },
      {
        name: 'verify-migration',
        description: 'Verify migration success',
        run: async () => {
          console.log('🔍 Verifying migration...');
          
          // Check critical tables
          const tables = [
            'subscription_plans',
            'workspace_subscriptions',
            'api_key_management',
            'storage_providers',
            'audit_logs'
          ];
          
          for (const table of tables) {
            try {
              const count = await prisma.$queryRawUnsafe(
                `SELECT COUNT(*) FROM ${table}`
              );
              console.log(`✅ Table ${table} exists`);
            } catch (error) {
              console.error(`❌ Table ${table} missing`);
              throw error;
            }
          }
          
          console.log('✅ Migration verified');
        }
      }
    ];
  }

  async run() {
    console.log('🚀 AudioTricks Schema Migration Tool');
    console.log('===================================\n');
    
    const answer = await question(
      '⚠️  This will migrate your database to the enhanced schema.\n' +
      'Have you backed up your database? (yes/no): '
    );
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled. Please backup your database first.');
      process.exit(1);
    }
    
    console.log('\nStarting migration...\n');
    
    for (const step of this.steps) {
      console.log(`\n📋 Step: ${step.description}`);
      
      try {
        await step.run();
        this.completedSteps.push(step.name);
      } catch (error) {
        console.error(`\n❌ Error in step '${step.name}':`, error);
        
        const rollback = await question(
          '\nDo you want to rollback completed steps? (yes/no): '
        );
        
        if (rollback.toLowerCase() === 'yes') {
          await this.rollback();
        }
        
        process.exit(1);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Test your application thoroughly');
    console.log('2. Update your backend code to use new models');
    console.log('3. Configure DigitalOcean Spaces credentials');
    console.log('4. Set up SendGrid API key');
    console.log('5. Configure eWAY payment gateway\n');
  }
  
  private async rollback() {
    console.log('\n🔄 Starting rollback...');
    
    for (const stepName of this.completedSteps.reverse()) {
      const step = this.steps.find(s => s.name === stepName);
      if (step?.rollback) {
        console.log(`Rolling back: ${step.description}`);
        try {
          await step.rollback();
        } catch (error) {
          console.error(`Rollback failed for ${stepName}:`, error);
        }
      }
    }
    
    console.log('✅ Rollback completed');
  }
}

// Run the migration
const migrator = new SchemaMigrator();
migrator.run()
  .catch(console.error)
  .finally(() => {
    rl.close();
    prisma.$disconnect();
  });