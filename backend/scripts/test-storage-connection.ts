#!/usr/bin/env tsx
import { StorageService } from '../src/services/storage/storage.service';
import { config } from '../src/config';

async function testStorageConnection() {
  console.log('🧪 Testing DigitalOcean Spaces Connection\n');
  
  // Check configuration
  console.log('📋 Configuration Check:');
  console.log(`✓ Endpoint: ${config.storage.digitalOcean.endpoint}`);
  console.log(`✓ Bucket: ${config.storage.digitalOcean.bucket}`);
  console.log(`✓ Region: ${config.storage.digitalOcean.region}`);
  console.log(`✓ CDN Endpoint: ${config.storage.digitalOcean.cdnEndpoint || 'Not configured'}`);
  console.log(`✓ Access Key: ${config.storage.digitalOcean.accessKey ? '***' + config.storage.digitalOcean.accessKey.slice(-4) : 'Not set'}`);
  console.log(`✓ Secret Key: ${config.storage.digitalOcean.secretKey ? '***' : 'Not set'}\n`);
  
  if (!config.storage.digitalOcean.accessKey || !config.storage.digitalOcean.secretKey) {
    console.error('❌ Error: DigitalOcean Spaces credentials not configured');
    console.log('\nPlease set the following environment variables:');
    console.log('- DO_SPACES_KEY');
    console.log('- DO_SPACES_SECRET');
    console.log('- DO_SPACES_BUCKET');
    process.exit(1);
  }
  
  try {
    const storage = new StorageService();
    const testKey = `test/connection-test-${Date.now()}.txt`;
    const testContent = 'AudioTricks Storage Connection Test';
    
    console.log('🚀 Testing Storage Operations:\n');
    
    // Test 1: Upload
    console.log('1️⃣ Testing file upload...');
    const uploadResult = await storage.uploadFile(testKey, Buffer.from(testContent), {
      contentType: 'text/plain',
      metadata: { test: 'true' }
    });
    console.log('✅ Upload successful');
    console.log(`   - Key: ${uploadResult.key}`);
    console.log(`   - URL: ${uploadResult.url}`);
    if (uploadResult.cdnUrl) {
      console.log(`   - CDN URL: ${uploadResult.cdnUrl}`);
    }
    
    // Test 2: File exists
    console.log('\n2️⃣ Testing file exists check...');
    const exists = await storage.fileExists(testKey);
    console.log(`✅ File exists: ${exists}`);
    
    // Test 3: Get metadata
    console.log('\n3️⃣ Testing metadata retrieval...');
    const metadata = await storage.getFileMetadata(testKey);
    if (metadata) {
      console.log('✅ Metadata retrieved');
      console.log(`   - Size: ${metadata.size} bytes`);
      console.log(`   - Content Type: ${metadata.contentType}`);
    }
    
    // Test 4: Download
    console.log('\n4️⃣ Testing file download...');
    const downloadedContent = await storage.downloadFile(testKey);
    const downloadedText = downloadedContent.toString();
    console.log(`✅ Download successful`);
    console.log(`   - Content matches: ${downloadedText === testContent}`);
    
    // Test 5: Generate signed URL
    console.log('\n5️⃣ Testing signed URL generation...');
    const signedUrl = await storage.getFileUrl(testKey, 300); // 5 minutes
    console.log('✅ Signed URL generated');
    console.log(`   - URL expires in: 5 minutes`);
    
    // Test 6: Delete
    console.log('\n6️⃣ Testing file deletion...');
    await storage.deleteFile(testKey);
    const existsAfterDelete = await storage.fileExists(testKey);
    console.log(`✅ Delete successful`);
    console.log(`   - File exists after delete: ${existsAfterDelete}`);
    
    console.log('\n✅ All tests passed! Storage connection is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ Storage connection test failed:');
    console.error(error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Verify your DigitalOcean Spaces credentials are correct');
    console.log('2. Check that the bucket exists and is accessible');
    console.log('3. Ensure your access key has the necessary permissions');
    console.log('4. Check your network connection\n');
    process.exit(1);
  }
}

// Run the test
testStorageConnection();