import puppeteer from 'puppeteer';

async function loginAndStay() {
  console.log('🚀 Logging into admin dashboard...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Go directly to admin login page
    console.log('📍 Going to admin login...');
    await page.goto('https://audiotricks.netlify.app/admin/login', {
      waitUntil: 'networkidle0'
    });
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Since the API works but form might have issues, let's try a different approach
    // Inject the login directly using the working API
    console.log('🔐 Performing login via API...');
    
    const loginResult = await page.evaluate(async () => {
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
        
        const data = await response.json();
        
        if (data.token) {
          // Store the token in localStorage
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          return { success: true, user: data.user };
        } else {
          return { success: false, error: data.error };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log(`👤 Logged in as: ${loginResult.user.email}`);
      console.log(`🛡️  Role: ${loginResult.user.role}`);
      
      // Navigate to admin dashboard
      console.log('🎯 Navigating to admin dashboard...');
      await page.goto('https://audiotricks.netlify.app/admin/dashboard', {
        waitUntil: 'networkidle0'
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take screenshot of admin dashboard
      await page.screenshot({ path: 'admin-dashboard-active.png', fullPage: true });
      console.log('📸 Admin dashboard screenshot saved');
      
      // Check current page content
      const pageInfo = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href,
        hasAdminNav: !!document.querySelector('.admin, [class*="admin"], nav'),
        userInfo: localStorage.getItem('user')
      }));
      
      console.log('\n🎉 ADMIN ACCESS GRANTED!');
      console.log(`📍 Current URL: ${pageInfo.url}`);
      console.log(`📄 Page title: ${pageInfo.title}`);
      console.log(`🔍 Admin navigation detected: ${pageInfo.hasAdminNav}`);
      
      if (pageInfo.userInfo) {
        const user = JSON.parse(pageInfo.userInfo);
        console.log(`👤 Active user: ${user.email} (${user.role})`);
      }
      
      console.log('\n🎛️  ADMIN INTERFACE IS NOW OPEN AND ACTIVE');
      console.log('💡 You can now interact with the admin dashboard');
      console.log('🔗 Navigate to any admin section');
      console.log('⚡ Session is maintained with valid JWT token');
      console.log('\n⌨️  Press Ctrl+C when done to close browser');
      
      // Keep browser open indefinitely
      await new Promise(() => {});
      
    } else {
      console.log('❌ Login failed:', loginResult.error);
      await page.screenshot({ path: 'login-failed.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'error.png', fullPage: true });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing browser...');
  process.exit(0);
});

loginAndStay().catch(console.error);