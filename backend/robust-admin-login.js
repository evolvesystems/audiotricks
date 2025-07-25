import puppeteer from 'puppeteer';

async function robustLogin() {
  console.log('🚀 Starting robust admin login...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-web-security']
  });

  const page = await browser.newPage();
  
  try {
    console.log('📍 Navigating to login page...');
    await page.goto('https://audiotricks.netlify.app/admin/login', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    console.log('⏳ Waiting for React app to load...');
    
    // Wait for login form to appear (React needs time to render)
    await page.waitForSelector('input', { timeout: 15000 });
    console.log('✅ Input elements detected');
    
    // Wait a bit more for full form load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot of login page
    await page.screenshot({ path: 'login-page-loaded.png', fullPage: true });
    console.log('📸 Login page screenshot saved');
    
    // Find email input with multiple strategies
    let emailInput;
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]', 
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]',
      'input:first-of-type'
    ];
    
    for (const selector of emailSelectors) {
      emailInput = await page.$(selector);
      if (emailInput) {
        console.log(`📧 Found email input with selector: ${selector}`);
        break;
      }
    }
    
    if (!emailInput) {
      console.log('❌ Could not find email input');
      // Get all input elements for debugging
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          name: input.name,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className
        }))
      );
      console.log('Available inputs:', inputs);
      return;
    }
    
    // Find password input
    let passwordInput;
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]'
    ];
    
    for (const selector of passwordSelectors) {
      passwordInput = await page.$(selector);
      if (passwordInput) {
        console.log(`🔒 Found password input with selector: ${selector}`);
        break;
      }
    }
    
    if (!passwordInput) {
      console.log('❌ Could not find password input');
      return;
    }
    
    // Clear and fill inputs
    console.log('🖊️  Filling credentials...');
    await emailInput.click({ clickCount: 3 }); // Select all
    await emailInput.type('admin@audiotricks.com');
    
    await passwordInput.click({ clickCount: 3 }); // Select all  
    await passwordInput.type('admin123');
    
    // Take screenshot with filled form
    await page.screenshot({ path: 'login-form-filled.png', fullPage: true });
    console.log('📸 Filled form screenshot saved');
    
    // Find and click submit button
    console.log('🔐 Submitting form...');
    
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]', 
      'button:contains("Sign in")',
      'button:contains("Login")',
      'button',
      '.submit-btn',
      '[role="button"]'
    ];
    
    let submitButton;
    for (const selector of submitSelectors) {
      if (selector.includes(':contains')) {
        // Handle text-based selectors differently
        submitButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('sign') ||
            btn.textContent.toLowerCase().includes('login')
          );
        });
      } else {
        submitButton = await page.$(selector);
      }
      
      if (submitButton && await submitButton.asElement()) {
        console.log(`🎯 Found submit button with selector: ${selector}`);
        break;
      }
    }
    
    if (submitButton && await submitButton.asElement()) {
      await submitButton.click();
    } else {
      console.log('⌨️  Using Enter key to submit...');
      await passwordInput.press('Enter');
    }
    
    // Wait for login response
    console.log('⏳ Waiting for login response...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Take screenshot of result
    await page.screenshot({ path: 'login-result-final.png', fullPage: true });
    console.log('📸 Result screenshot saved');
    
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      console.log('🎉 LOGIN SUCCESSFUL!');
      console.log('🎯 Admin dashboard loaded');
      console.log('👤 Logged in as: admin@audiotricks.com');
      
      // Get page info
      const pageInfo = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        headings: Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent.trim())
          .filter(text => text.length > 0)
          .slice(0, 5)
      }));
      
      console.log('📄 Page title:', pageInfo.title);
      console.log('📋 Page headings:', pageInfo.headings);
      
      console.log('\n🎛️  ADMIN INTERFACE IS NOW OPEN');
      console.log('💡 You can interact with the browser window');
      console.log('🔗 Navigate to different admin sections');
      console.log('⚡ Session will remain active');
      console.log('\n⌨️  Press Ctrl+C to close when done');
      
      // Keep browser open indefinitely
      await new Promise(() => {});
      
    } else {
      console.log('❌ Login failed or unexpected redirect');
      console.log('Current URL:', currentUrl);
      
      // Check for error messages
      const possibleErrors = await page.$$eval('*', elements => 
        elements
          .map(el => el.textContent?.trim())
          .filter(text => text && (
            text.toLowerCase().includes('error') ||
            text.toLowerCase().includes('invalid') ||
            text.toLowerCase().includes('failed') ||
            text.toLowerCase().includes('wrong')
          ))
          .slice(0, 3)
      );
      
      if (possibleErrors.length > 0) {
        console.log('🚨 Possible error messages:', possibleErrors);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    try {
      await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved');
    } catch {}
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  process.exit(0);
});

robustLogin().catch(console.error);