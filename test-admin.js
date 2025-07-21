import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 Starting admin interface test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  // Listen to console logs from the page
  page.on('console', msg => {
    console.log(`🌐 PAGE LOG [${msg.type()}]:`, msg.text());
  });
  
  // Listen to page errors
  page.on('pageerror', err => {
    console.log('❌ PAGE ERROR:', err.message);
  });
  
  // Listen to network requests
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`📡 API ${response.status()}: ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Navigating to admin login...');
    await page.goto('http://localhost:3000/admin/login', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('🔐 Filling login form...');
    
    // Wait for login form and fill it
    await page.waitForSelector('input[type="text"], input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    
    // Fill the form
    const usernameInput = await page.$('input[type="text"], input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    await usernameInput.type('JohnNorth');
    await passwordInput.type('password123');
    
    console.log('📤 Submitting login...');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or redirect
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    
    console.log('✅ Login successful, current URL:', page.url());
    
    // Navigate to users page
    console.log('👥 Navigating to users page...');
    await page.goto('http://localhost:3000/admin/users', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('📊 Current URL:', page.url());
    
    // Wait a bit for the page to load and make API calls
    await page.waitForTimeout(3000);
    
    // Check if users are displayed
    const userTableExists = await page.$('table') !== null;
    const userRows = await page.$$('tbody tr');
    
    console.log('📋 User table exists:', userTableExists);
    console.log('👤 Number of user rows:', userRows.length);
    
    // Get page content for debugging
    const pageTitle = await page.title();
    const hasErrorMessage = await page.$('.error, [class*="error"]') !== null;
    
    console.log('📄 Page title:', pageTitle);
    console.log('❌ Has error message:', hasErrorMessage);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'admin-users-page.png', 
      fullPage: true 
    });
    console.log('📸 Screenshot saved as admin-users-page.png');
    
    // Wait a bit more to see console logs
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
  
  console.log('🏁 Test completed. Browser will stay open for inspection.');
  // Don't close browser so you can inspect
  // await browser.close();
})();