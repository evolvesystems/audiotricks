const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 DEBUG: Frontend Login API Call');
  console.log('🌐 Site: https://audiotricks.evolvepreneuriq.com/login');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Capture all network requests
    const requests = [];
    const responses = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log('📡 REQUEST:', request.method(), request.url());
        console.log('📡 Headers:', request.headers());
        if (request.postData()) {
          console.log('📡 Body:', request.postData());
        }
        requests.push({
          method: request.method(),
          url: request.url(),
          headers: request.headers(),
          body: request.postData()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('📥 RESPONSE:', response.status(), response.url());
        responses.push({
          status: response.status(),
          url: response.url(),
          headers: response.headers()
        });
        
        // Try to get response body
        response.text().then(text => {
          console.log('📥 Response Body:', text.substring(0, 500));
        }).catch(e => {
          console.log('📥 Could not read response body');
        });
      }
    });
    
    // Capture console logs and errors
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`🖥️  ${type.toUpperCase()}:`, msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('❌ JavaScript Error:', error.message);
      console.log('Stack:', error.stack);
    });
    
    // Load login page
    console.log('📖 Loading login page...');
    await page.goto('https://audiotricks.evolvepreneuriq.com/login', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for React to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Page loaded');
    
    // Fill form
    console.log('📝 Filling login form...');
    await page.type('input[type="email"]', 'test@audiotricks.com', { delay: 50 });
    await page.type('input[type="password"]', 'testpassword123', { delay: 50 });
    
    // Submit and monitor network activity
    console.log('🔄 Submitting login form...');
    await page.click('button[type="submit"]');
    
    // Wait for network activity to complete
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    console.log('\n📊 NETWORK ACTIVITY SUMMARY:');
    console.log('Requests made:', requests.length);
    console.log('Responses received:', responses.length);
    
    // Check final page state
    const finalUrl = page.url();
    console.log('\n📍 Final URL:', finalUrl);
    
    // Check for loading state
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      const buttonText = await page.evaluate(btn => btn.textContent, submitButton);
      console.log('🔘 Submit button text:', buttonText);
      
      if (buttonText.includes('Signing in')) {
        console.log('⚠️  ISSUE: Form still in loading state!');
      }
    }
    
    // Check localStorage for tokens
    const localStorage = await page.evaluate(() => {
      return {
        token: localStorage.getItem('auth_token'),
        user: localStorage.getItem('auth_user'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('\n💾 LocalStorage:', localStorage);
    
    console.log('\n🎯 Debug complete! Check logs above for issues.');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  } finally {
    await browser.close();
  }
})();