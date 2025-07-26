const puppeteer = require('puppeteer');

(async () => {
  console.log('🔄 Testing COMPLETE Login/Logout Cycle');
  console.log('🌐 Site: https://audiotricks.evolvepreneuriq.com');
  console.log('👤 Test Account: test@audiotricks.com / testpassword123');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('🖥️  Console:', msg.text()));
    page.on('pageerror', error => console.log('❌ Page Error:', error.message));
    
    // STEP 1: Load login page
    console.log('📖 Step 1: Loading login page...');
    await page.goto('https://audiotricks.evolvepreneuriq.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Login page loaded');
    
    // STEP 2: Login
    console.log('🔐 Step 2: Logging in...');
    await page.type('input[type="email"]', 'test@audiotricks.com', { delay: 50 });
    await page.type('input[type="password"]', 'testpassword123', { delay: 50 });
    
    await page.screenshot({ path: './cycle-1-before-login.png' });
    console.log('📸 Screenshot: cycle-1-before-login.png');
    
    await page.click('button[type="submit"]');
    console.log('🔄 Login submitted...');
    
    // Wait for login response and potential redirect
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const afterLoginUrl = page.url();
    console.log('📍 After login URL:', afterLoginUrl);
    
    await page.screenshot({ path: './cycle-2-after-login.png' });
    console.log('📸 Screenshot: cycle-2-after-login.png');
    
    // STEP 3: Check if login was successful
    let loginSuccessful = false;
    
    if (afterLoginUrl.includes('/dashboard')) {
      console.log('✅ LOGIN SUCCESS: Redirected to dashboard');
      loginSuccessful = true;
    } else {
      // Check for user indicators on current page
      const userElements = await page.$$('[data-testid*="user"], .logout, .user-menu, [href*="logout"]');
      const dashboardLinks = await page.$$('[href="/dashboard"], [href*="dashboard"]');
      
      if (userElements.length > 0 || dashboardLinks.length > 0) {
        console.log('✅ LOGIN SUCCESS: User session detected on page');
        loginSuccessful = true;
      } else {
        console.log('⚠️  Login status unclear - checking for error messages');
        const errorElement = await page.$('.text-red-800, .bg-red-50');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('❌ Login failed with error:', errorText);
        }
      }
    }
    
    // STEP 4: Navigate to dashboard (if not already there)
    if (loginSuccessful && !afterLoginUrl.includes('/dashboard')) {
      console.log('🏠 Step 4: Navigating to dashboard...');
      await page.goto('https://audiotricks.evolvepreneuriq.com/dashboard');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      await page.screenshot({ path: './cycle-3-dashboard.png' });
      console.log('📸 Screenshot: cycle-3-dashboard.png');
    }
    
    // STEP 5: Look for logout option
    console.log('🔍 Step 5: Looking for logout option...');
    
    // Try multiple selectors for logout
    const logoutSelectors = [
      'button:contains("Logout")',
      'button:contains("Sign Out")', 
      'a:contains("Logout")',
      'a:contains("Sign Out")',
      '[data-testid="logout"]',
      '.logout',
      '[href*="logout"]'
    ];
    
    let logoutElement = null;
    for (const selector of logoutSelectors) {
      try {
        logoutElement = await page.$(selector);
        if (logoutElement) {
          console.log(`✅ Found logout element with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Selector not found, try next
      }
    }
    
    // If no logout button found, try clicking user menu or profile
    if (!logoutElement) {
      console.log('🔍 Looking for user menu or profile dropdown...');
      const userMenuSelectors = ['.user-menu', '[data-testid="user-menu"]', '.profile-dropdown'];
      
      for (const selector of userMenuSelectors) {
        const menuElement = await page.$(selector);
        if (menuElement) {
          console.log(`🖱️  Clicking user menu: ${selector}`);
          await menuElement.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Now look for logout in the opened menu
          logoutElement = await page.$('button:contains("Logout"), a:contains("Logout")');
          if (logoutElement) {
            console.log('✅ Found logout in user menu');
            break;
          }
        }
      }
    }
    
    // STEP 6: Logout
    if (logoutElement) {
      console.log('🚪 Step 6: Logging out...');
      await page.screenshot({ path: './cycle-4-before-logout.png' });
      console.log('📸 Screenshot: cycle-4-before-logout.png');
      
      await logoutElement.click();
      console.log('🔄 Logout clicked...');
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const afterLogoutUrl = page.url();
      console.log('📍 After logout URL:', afterLogoutUrl);
      
      await page.screenshot({ path: './cycle-5-after-logout.png' });
      console.log('📸 Screenshot: cycle-5-after-logout.png');
      
      // Check if logged out successfully
      if (afterLogoutUrl.includes('/login') || afterLogoutUrl === 'https://audiotricks.evolvepreneuriq.com/') {
        console.log('✅ LOGOUT SUCCESS: Redirected to login/home page');
      } else {
        console.log('🤔 Logout status unclear - checking page content');
        const loginForm = await page.$('input[type="email"]');
        if (loginForm) {
          console.log('✅ LOGOUT SUCCESS: Login form visible');
        } else {
          console.log('⚠️  Logout may not have completed properly');
        }
      }
    } else {
      console.log('❌ Could not find logout button/link');
      console.log('📋 Available elements on page:');
      const allButtons = await page.$$eval('button, a', elements => 
        elements.map(el => ({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 50),
          href: el.href || 'N/A'
        })).filter(el => el.text)
      );
      console.log(allButtons.slice(0, 10)); // Show first 10 elements
    }
    
    console.log('🎯 Login/Logout cycle test completed!');
    
    // Keep browser open for inspection
    console.log('⏱️  Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    await page.screenshot({ path: './cycle-error.png' });
    console.log('📸 Error screenshot: cycle-error.png');
  } finally {
    await browser.close();
    console.log('🏁 Test complete!');
  }
})();