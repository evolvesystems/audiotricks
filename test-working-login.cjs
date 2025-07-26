const puppeteer = require('puppeteer');

(async () => {
  console.log('🎉 Testing AudioTricks WORKING Login!');
  console.log('🌐 Site: https://audiotricks.evolvepreneuriq.com/login');
  console.log('👤 Test Account: test@audiotricks.com / testpassword123');
  
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
    
    // Test 1: Load login page
    console.log('📖 Loading login page...');
    await page.goto('https://audiotricks.evolvepreneuriq.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Login page loaded successfully');
    
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Fill login form with working credentials
    console.log('👤 Filling login form with test credentials...');
    await page.type('input[type="email"]', 'test@audiotricks.com', { delay: 100 });
    await page.type('input[type="password"]', 'testpassword123', { delay: 100 });
    
    console.log('📝 Form filled successfully');
    
    // Take screenshot before submitting
    await page.screenshot({ path: './login-before-submit.png' });
    console.log('📸 Screenshot: login-before-submit.png');
    
    // Test 3: Submit login
    await page.click('button[type="submit"]');
    console.log('🔄 Login form submitted');
    
    // Wait for response and potential redirect
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check final URL and page state
    const finalUrl = page.url();
    console.log('📍 Final URL:', finalUrl);
    
    // Take final screenshot
    await page.screenshot({ path: './login-after-submit.png' });
    console.log('📸 Screenshot: login-after-submit.png');
    
    // Test 4: Check for success indicators
    if (finalUrl.includes('/dashboard')) {
      console.log('🎉 LOGIN SUCCESS: Redirected to dashboard!');
    } else if (finalUrl.includes('/login')) {
      // Check for error messages
      const errorElement = await page.$('.text-red-800, .bg-red-50, [class*="error"]');
      if (errorElement) {
        const errorText = await page.evaluate(el => el.textContent, errorElement);
        console.log('⚠️  Error message:', errorText);
      } else {
        console.log('🤔 Still on login page but no error visible');
      }
    } else {
      console.log('🔄 Redirected to:', finalUrl);
    }
    
    // Test 5: Check for user session indicators
    const userElements = await page.$$('[data-testid*="user"], .user-info, .logout');
    console.log(`👤 Found ${userElements.length} user session elements`);
    
    console.log('🎯 Login test completed!');
    
    // Keep browser open for manual inspection
    console.log('⏱️  Keeping browser open for 15 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    
    // Take error screenshot
    try {
      const page = browser.pages()[0];
      if (page) {
        await page.screenshot({ path: './login-error.png' });
        console.log('📸 Error screenshot: login-error.png');
      }
    } catch (screenshotError) {
      console.log('❌ Could not take error screenshot');
    }
  } finally {
    await browser.close();
    console.log('🏁 Browser closed - Test complete!');
  }
})();