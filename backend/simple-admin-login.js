import puppeteer from 'puppeteer';

async function simpleLogin() {
  console.log('🚀 Logging in to admin dashboard...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Go to login page
    await page.goto('https://audiotricks.netlify.app/admin/login');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Fill login form
    await page.type('input[type="email"]', 'admin@audiotricks.com');
    await page.type('input[type="password"]', 'admin123');
    
    // Click login button
    const loginButton = await page.$('button[type="submit"]') || await page.$('button');
    if (loginButton) {
      await loginButton.click();
    } else {
      await page.keyboard.press('Enter');
    }
    
    // Wait and check result
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const url = page.url();
    console.log('Current URL:', url);
    
    if (url.includes('/admin') && !url.includes('/login')) {
      console.log('✅ LOGIN SUCCESS! Admin dashboard loaded');
      console.log('🎯 You can now interact with the admin interface');
      console.log('🔒 Logged in as: admin@audiotricks.com');
      console.log('');
      console.log('Press Ctrl+C when done to close browser');
      
      // Take a screenshot
      await page.screenshot({ path: 'current-admin-view.png', fullPage: true });
      console.log('📸 Screenshot saved as: current-admin-view.png');
      
      // Keep browser open
      await new Promise(() => {});
    } else {
      console.log('❌ Login may have failed - still on login page');
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Closing browser...');
  process.exit(0);
});

simpleLogin();