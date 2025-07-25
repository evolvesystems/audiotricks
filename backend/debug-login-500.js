import puppeteer from 'puppeteer';

async function debugLogin500() {
  console.log('🚀 Debugging 500 error on login...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  // Monitor all network requests
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    
    if (url.includes('/api/')) {
      console.log(`🌐 API ${response.request().method()} ${url} → ${status}`);
      
      if (status >= 400) {
        response.text().then(text => {
          console.log(`❌ Error response: ${text}`);
        }).catch(() => {});
      }
    }
  });
  
  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });
  
  try {
    console.log('📍 Going to admin login...');
    await page.goto('https://audiotricks.evolvepreneuriq.com/admin/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('✅ Page loaded, trying to fill login form...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to find and fill login form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (emailInput && passwordInput) {
      console.log('📝 Found form inputs, filling credentials...');
      await emailInput.type('admin@audiotricks.com');
      await passwordInput.type('admin123');
      
      await page.screenshot({ path: 'login-form-debug.png', fullPage: true });
      console.log('📸 Screenshot saved: login-form-debug.png');
      
      console.log('🔐 Submitting form to trigger 500 error...');
      
      // Submit form and capture the 500 error details
      const submitButton = await page.$('button[type="submit"]') || await page.$('button');
      if (submitButton) {
        await submitButton.click();
      } else {
        await passwordInput.press('Enter');
      }
      
      console.log('⏳ Waiting for response...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } else {
      console.log('❌ Login form not found, testing API directly...');
    }
    
    // Test the API directly to see the 500 error
    console.log('🧪 Testing login API directly...');
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: 'admin@audiotricks.com',
            password: 'admin123'
          })
        });
        
        const responseText = await response.text();
        
        return {
          status: response.status,
          statusText: response.statusText,
          body: responseText,
          headers: Object.fromEntries(response.headers.entries())
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    console.log('\n🔍 API Response Details:');
    console.log(`Status: ${apiResponse.status} ${apiResponse.statusText}`);
    console.log(`Body: ${apiResponse.body}`);
    console.log(`Headers:`, apiResponse.headers);
    
    if (apiResponse.status === 500) {
      console.log('\n💥 500 Internal Server Error detected!');
      console.log('This is likely a database connection or server configuration issue.');
    }
    
    await page.screenshot({ path: 'final-state-debug.png', fullPage: true });
    console.log('📸 Final screenshot saved: final-state-debug.png');
    
    console.log('\n🎯 Debug complete. Check the console output above for error details.');
    console.log('💡 Keep browser open to inspect manually...');
    console.log('⌨️  Press Ctrl+C when done');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('💥 Debug test failed:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Closing debug session...');
  process.exit(0);
});

debugLogin500();