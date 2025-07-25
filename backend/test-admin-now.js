import puppeteer from 'puppeteer';

async function testAdminNow() {
  console.log('🚀 Testing admin page...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--disable-web-security']
  });

  const page = await browser.newPage();
  
  // Monitor for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
    }
  });
  
  try {
    console.log('📍 Going to admin login...');
    await page.goto('https://audiotricks.netlify.app/admin/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    
    console.log('✅ Page loaded, logging in via API...');
    
    const loginResult = await page.evaluate(async () => {
      try {
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
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    if (loginResult.success) {
      console.log('✅ Login successful!');
      console.log(`👤 Logged in as: ${loginResult.user.email}`);
      
      console.log('🎯 Going to admin dashboard...');
      await page.goto('https://audiotricks.netlify.app/admin', { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const currentState = await page.evaluate(() => ({
        url: window.location.href,
        title: document.title,
        hasContent: document.body.textContent.length > 100,
        bodyText: document.body.textContent.substring(0, 200)
      }));
      
      console.log('\n🎉 ADMIN ACCESS STATUS:');
      console.log(`📍 URL: ${currentState.url}`);
      console.log(`📄 Title: ${currentState.title}`);
      console.log(`📝 Has content: ${currentState.hasContent}`);
      console.log(`📋 Page preview: ${currentState.bodyText}...`);
      
      await page.screenshot({ path: 'current-admin-state.png', fullPage: true });
      console.log('📸 Screenshot saved: current-admin-state.png');
      
      console.log('\n💡 Admin interface is open - you can interact with it now');
      console.log('⌨️  Press Ctrl+C when done');
      
      await new Promise(() => {});
      
    } else {
      console.log('❌ Login failed:', loginResult.error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    await page.screenshot({ path: 'admin-error.png', fullPage: true });
  }
}

process.on('SIGINT', () => {
  console.log('\n👋 Closing...');
  process.exit(0);
});

testAdminNow();