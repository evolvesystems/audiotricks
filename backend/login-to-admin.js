import puppeteer from 'puppeteer';

async function loginToAdmin() {
  console.log('🚀 Logging into admin interface...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  
  try {
    // Go to admin login
    await page.goto('https://audiotricks.netlify.app/admin/login');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Login via API (since we know it works)
    console.log('🔐 Authenticating...');
    const loginResult = await page.evaluate(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@audiotricks.com',
          password: 'admin123'
        })
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
      return { success: false, error: data.error };
    });
    
    if (!loginResult.success) {
      console.log('❌ Login failed:', loginResult.error);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log(`👤 Logged in as: ${loginResult.user.email} (${loginResult.user.role})`);
    
    // Try different admin routes that might exist
    const adminRoutes = [
      '/admin',
      '/admin/users', 
      '/admin/dashboard',
      '/admin/settings'
    ];
    
    for (const route of adminRoutes) {
      console.log(`🔍 Trying route: ${route}`);
      await page.goto(`https://audiotricks.netlify.app${route}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const pageContent = await page.evaluate(() => {
        const is404 = document.body.textContent.includes('404') || 
                     document.body.textContent.includes('Page Not Found');
        const hasAdminContent = document.querySelector('.admin, [class*="admin"], nav, .sidebar');
        return { is404, hasAdminContent: !!hasAdminContent, url: window.location.href };
      });
      
      if (!pageContent.is404) {
        console.log(`✅ Found working admin route: ${route}`);
        console.log(`📍 Current URL: ${pageContent.url}`);
        
        await page.screenshot({ path: `admin-${route.replace('/', '-')}.png`, fullPage: true });
        console.log(`📸 Screenshot saved for ${route}`);
        
        console.log('\n🎉 ADMIN INTERFACE LOADED!');
        console.log('💡 You can now interact with the admin interface');
        console.log('🔗 Navigate to different sections manually');
        console.log('⚡ Authentication token is set and valid');
        console.log('\n⌨️  Press Ctrl+C when done to close browser');
        
        // Keep browser open
        await new Promise(() => {});
        return;
      }
    }
    
    // If no admin routes work, stay on login page but with token set
    console.log('⚠️  No admin dashboard routes found, staying on login page');
    console.log('🔑 But you are authenticated! Try navigating manually to:');
    console.log('   - /admin');
    console.log('   - /admin/users'); 
    console.log('   - /admin/settings');
    
    await page.goto('https://audiotricks.netlify.app/admin/login');
    await page.screenshot({ path: 'authenticated-login.png', fullPage: true });
    
    console.log('\n🔓 AUTHENTICATION SUCCESSFUL');
    console.log('💡 You can manually navigate to admin sections');
    console.log('⚡ JWT token is stored and valid');
    console.log('\n⌨️  Press Ctrl+C when done to close browser');
    
    await new Promise(() => {});
    
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

loginToAdmin().catch(console.error);