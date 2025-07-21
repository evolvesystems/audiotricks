const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Starting browser test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📍 Opening app at http://localhost:3000');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage loaded successfully');
    
    // Check for authentication state
    const pageTitle = await page.title();
    console.log('📝 Page title:', pageTitle);
    
    // Check if there's a login form or if user is already authenticated
    const loginElements = await page.evaluate(() => {
      const loginButton = document.querySelector('button[type="submit"]');
      const loginForm = document.querySelector('form');
      const authToken = localStorage.getItem('authToken');
      
      return {
        hasLoginButton: !!loginButton,
        hasLoginForm: !!loginForm,
        hasAuthToken: !!authToken,
        bodyText: document.body.innerText.slice(0, 500)
      };
    });
    
    console.log('🔍 Authentication state:', loginElements);
    
    // Navigate to different sections to test routing
    console.log('🧪 Testing navigation...');
    
    // Try admin login
    console.log('📍 Navigating to admin login...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/02-admin-login.png', fullPage: true });
    
    const adminLoginPage = await page.evaluate(() => ({
      url: window.location.href,
      hasEmailInput: !!document.querySelector('input[type="text"], input[type="email"]'),
      hasPasswordInput: !!document.querySelector('input[type="password"]'),
      hasLoginButton: !!document.querySelector('button[type="submit"]'),
      pageContent: document.body.innerText.slice(0, 300)
    }));
    
    console.log('🔐 Admin login page:', adminLoginPage);
    
    // Try user dashboard
    console.log('📍 Navigating to user dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'screenshots/03-user-dashboard.png', fullPage: true });
    
    const dashboardPage = await page.evaluate(() => ({
      url: window.location.href,
      pageContent: document.body.innerText.slice(0, 300)
    }));
    
    console.log('📊 Dashboard page:', dashboardPage);
    
    console.log('✅ Browser test completed successfully!');
    console.log('📸 Screenshots saved to screenshots/ directory');
    
  } catch (error) {
    console.error('❌ Error during browser test:', error);
    await page.screenshot({ path: 'screenshots/error-screenshot.png', fullPage: true });
  } finally {
    // Keep browser open for manual testing
    console.log('🖥️  Browser left open for manual testing');
    console.log('🔗 Visit: http://localhost:3000');
    
    // Close browser after 30 seconds
    setTimeout(async () => {
      console.log('⏰ Closing browser...');
      await browser.close();
    }, 30000);
  }
})();