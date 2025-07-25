import puppeteer from 'puppeteer';

async function testAdminLogin() {
  console.log('🚀 Starting admin login test...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to admin login page
    console.log('📍 Navigating to admin login page...');
    await page.goto('https://audiotricks.netlify.app/admin/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load and take screenshot
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.screenshot({ path: 'admin-login-page.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-login-page.png');

    // Check if login form exists
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitButton = await page.$('button[type="submit"]') || await page.$('input[type="submit"]') || await page.$('button');

    if (!emailInput) {
      console.log('❌ Email input not found');
      const pageContent = await page.content();
      console.log('Page content preview:', pageContent.substring(0, 500));
      return;
    }

    if (!passwordInput) {
      console.log('❌ Password input not found');
      return;
    }

    console.log('✅ Login form elements found');

    // Fill in login credentials
    console.log('📝 Filling login credentials...');
    await emailInput.type('admin@audiotricks.com');
    await passwordInput.type('admin123');
    
    // Take screenshot before submit
    await page.screenshot({ path: 'admin-login-filled.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-login-filled.png');

    // Submit the form
    console.log('🔐 Submitting login form...');
    
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        submitButton.click()
      ]);
    } else {
      // Try pressing Enter as fallback
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
        passwordInput.press('Enter')
      ]);
    }

    // Check current URL after login attempt
    const currentUrl = page.url();
    console.log('📍 Current URL after login:', currentUrl);

    // Take screenshot after login attempt
    await page.screenshot({ path: 'admin-login-result.png', fullPage: true });
    console.log('📸 Screenshot saved: admin-login-result.png');

    // Check for success indicators
    const isOnDashboard = currentUrl.includes('/admin') && !currentUrl.includes('/login');
    const hasError = await page.$('.error, .alert-error, [role="alert"]');
    const hasSuccessContent = await page.$('.dashboard, .admin-content') || await page.$('h1');

    if (isOnDashboard && !hasError) {
      console.log('✅ LOGIN SUCCESS: Redirected to admin area');
      
      // Get page title and basic content
      const title = await page.title();
      console.log('📄 Page title:', title);
      
      const headings = await page.$$eval('h1, h2, h3', elements => 
        elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
      );
      console.log('📋 Page headings:', headings);
      
    } else if (hasError) {
      console.log('❌ LOGIN FAILED: Error message present');
      const errorText = await hasError.textContent();
      console.log('🚨 Error message:', errorText);
    } else if (currentUrl.includes('/login')) {
      console.log('❌ LOGIN FAILED: Still on login page');
      
      // Check for any error messages
      const possibleErrors = await page.$$eval('*', elements => 
        elements
          .map(el => el.textContent?.trim())
          .filter(text => text && (
            text.toLowerCase().includes('error') ||
            text.toLowerCase().includes('invalid') ||
            text.toLowerCase().includes('failed') ||
            text.toLowerCase().includes('wrong')
          ))
      );
      
      if (possibleErrors.length > 0) {
        console.log('🚨 Possible error messages found:', possibleErrors);
      }
    } else {
      console.log('⚠️  UNKNOWN STATE: Unexpected page state');
    }

    // Check network requests for API calls
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    console.log('🌐 API Responses during login:', responses);

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    try {
      const page = await browser.newPage();
      await page.screenshot({ path: 'admin-login-error.png', fullPage: true });
      console.log('📸 Error screenshot saved: admin-login-error.png');
    } catch (screenshotError) {
      console.error('Failed to take error screenshot:', screenshotError.message);
    }
  } finally {
    await browser.close();
    console.log('🏁 Test completed');
  }
}

// Run the test
testAdminLogin().catch(console.error);