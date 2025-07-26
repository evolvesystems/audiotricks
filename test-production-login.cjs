const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testing AudioTricks Production Login...');
  console.log('🌐 Site: https://audiotricks.evolvepreneuriq.com/login');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('🖥️  Console:', msg.text()));
    page.on('pageerror', error => console.log('❌ Page Error:', error.message));
    
    // Test 1: Load login page directly
    console.log('📖 Loading login page...');
    await page.goto('https://audiotricks.evolvepreneuriq.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Login page loaded');
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Check if login form is present
    console.log('🔍 Checking for login form...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (emailInput && passwordInput && submitButton) {
      console.log('✅ Login form found with all required fields');
    } else {
      console.log('❌ Login form incomplete');
      console.log('Email input:', !!emailInput);
      console.log('Password input:', !!passwordInput);
      console.log('Submit button:', !!submitButton);
    }
    
    // Test 3: Try to create a test account first (register)
    console.log('🔧 Checking if registration link works...');
    const registerLink = await page.$('a[href="/register"]');
    if (registerLink) {
      console.log('✅ Register link found');
      
      // Click register link
      await registerLink.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = page.url();
      if (currentUrl.includes('/register')) {
        console.log('✅ Registration page accessible');
        
        // Go back to login
        await page.goto('https://audiotricks.evolvepreneuriq.com/login');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Test 4: Test login functionality with demo credentials
    console.log('👤 Testing login functionality...');
    
    // Try to fill the form
    await page.type('input[type="email"]', 'test@audiotricks.com', { delay: 100 });
    await page.type('input[type="password"]', 'testpassword123', { delay: 100 });
    
    console.log('📝 Form filled with test credentials');
    
    // Take screenshot before submitting
    await page.screenshot({ path: './test-production-before-login.png' });
    console.log('📸 Screenshot saved: test-production-before-login.png');
    
    // Click login button
    await page.click('button[type="submit"]');
    console.log('🔄 Login form submitted');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check current URL and page state
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    // Take final screenshot
    await page.screenshot({ path: './test-production-after-login.png' });
    console.log('📸 Screenshot saved: test-production-after-login.png');
    
    // Check for error messages
    const errorElement = await page.$('.text-red-800, .bg-red-50, [class*="error"]');
    if (errorElement) {
      const errorText = await page.evaluate(el => el.textContent, errorElement);
      console.log('⚠️  Error message found:', errorText);
    } else {
      console.log('✅ No error messages visible');
    }
    
    // Check if redirected to dashboard
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ LOGIN SUCCESS: Redirected to dashboard');
    } else if (finalUrl.includes('/login')) {
      console.log('⚠️  Still on login page - login may have failed');
    } else {
      console.log('🤔 Unexpected redirect:', finalUrl);
    }
    
    console.log('🎯 Test completed - check screenshots for visual verification');
    
    // Keep browser open for 10 seconds for manual inspection
    console.log('⏱️  Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Take error screenshot
    try {
      const page = browser.pages()[0];
      if (page) {
        await page.screenshot({ path: './test-production-error.png' });
        console.log('📸 Error screenshot saved: test-production-error.png');
      }
    } catch (screenshotError) {
      console.log('❌ Could not take error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🏁 Browser closed');
  }
})();