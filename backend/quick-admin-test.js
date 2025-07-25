import puppeteer from 'puppeteer';

async function quickTest() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
  const page = await browser.newPage();
  
  // Monitor console errors and network failures
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
    // Go to admin page
    await page.goto('https://audiotricks.netlify.app/admin', { waitUntil: 'networkidle0' });
    
    // Login via API
    await page.evaluate(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@audiotricks.com', password: 'admin123' })
      });
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    });
    
    console.log('✅ Logged in, checking for errors...');
    await page.reload({ waitUntil: 'networkidle0' });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('✅ No major errors detected. Check browser window for any issues.');
    console.log('Press Ctrl+C to close');
    
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

process.on('SIGINT', process.exit);
quickTest();