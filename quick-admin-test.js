import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();
  
  // Listen to all console logs
  page.on('console', msg => {
    console.log(`🌐 [${msg.type()}]:`, msg.text());
  });
  
  // Navigate and login
  await page.goto('http://localhost:3000/admin/login');
  await page.waitForSelector('input[type="text"], input[type="email"]');
  
  await page.type('input[type="text"], input[type="email"]', 'JohnNorth');
  await page.type('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation();
  
  console.log('✅ Logged in, current URL:', page.url());
  
  // Wait for page to stabilize and show any debug output
  await page.waitForTimeout(3000);
  
  // Keep browser open for manual inspection
  console.log('🔍 Check the page manually. Browser will stay open.');
})();