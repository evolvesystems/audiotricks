#!/usr/bin/env node

import { APIKeyManager } from './api-keys';

/**
 * CLI utility to generate API keys
 * Usage: npm run generate-api-key [name]
 */
function generateApiKey() {
  const args = process.argv.slice(2);
  const name = args[0] || 'default';
  
  console.log('🔑 Generating new API key...\n');
  
  const apiKey = APIKeyManager.generateApiKey('atk');
  const keyHash = APIKeyManager.hashApiKey(apiKey);
  const keyPrefix = APIKeyManager.getKeyPrefix(apiKey);
  
  console.log(`Name: ${name}`);
  console.log(`API Key: ${apiKey}`);
  console.log(`Key Prefix: ${keyPrefix}`);
  console.log(`Key Hash: ${keyHash}\n`);
  
  console.log('📝 Add this to your .env file:');
  console.log('API_KEYS=["' + apiKey + '"]');
  console.log('\n⚠️  Keep this API key secure! It will not be shown again.');
  console.log('✅ You can add multiple keys by separating them with commas in the JSON array.');
}

// Run if called directly
generateApiKey();

export { generateApiKey };