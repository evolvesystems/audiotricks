const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing AudioTricks Login and Navigation...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Load homepage
    console.log('📖 Loading homepage...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);
    console.log('✅ Homepage loaded');
    
    // Test 2: Navigate to admin login
    console.log('🔐 Navigating to admin login...');
    await page.goto('http://localhost:3000/admin/login');
    await page.waitForTimeout(2000);
    console.log('✅ Login page loaded');
    
    // Test 3: Attempt login
    console.log('👤 Attempting admin login...');
    await page.type('input[type="email"]', 'admin@audiotricks.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check if we're redirected to admin dashboard
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/admin') && \!currentUrl.includes('/login')) {
      console.log('✅ Login successful - redirected to admin area');
    } else {
      console.log('⚠️  Login may have failed or redirect pending');
    }
    
    // Test 4: Check for admin dashboard elements
    const adminElements = await page.$$('[data-testid*="admin"], .admin-dashboard, h1, h2');
    console.log(`📊 Found ${adminElements.length} potential dashboard elements`);
    
    // Take a screenshot
    await page.screenshot({ path: './test-screenshots/login-test.png' });
    console.log('📸 Screenshot saved as login-test.png');
    
    console.log('🎉 Login test completed\!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
})();
