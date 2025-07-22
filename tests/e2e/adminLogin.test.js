import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Admin Login E2E Test', () => {
  let browser;
  let page;
  
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, '../../screenshots');
  
  beforeAll(async () => {
    await fs.mkdir(screenshotsDir, { recursive: true });
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('should login to admin area successfully', async () => {
    console.log('Step 1: Navigating to admin login page...');
    
    // Navigate to admin page
    await page.goto('http://localhost:3000/admin', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Take screenshot of initial page
    await page.screenshot({
      path: path.join(screenshotsDir, '01-initial-page.png'),
      fullPage: true
    });
    console.log('Screenshot taken: 01-initial-page.png');

    // Wait for login form to load
    console.log('Step 2: Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    
    // Fill in email field
    console.log('Step 3: Filling in email field with test@example.com');
    await page.type('input[type="email"]', 'test@example.com');
    
    // Fill in password field
    console.log('Step 4: Filling in password field');
    await page.type('input[type="password"]', 'TestPass123');
    
    // Take screenshot with form filled
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-form-filled.png'),
      fullPage: true
    });
    console.log('Screenshot taken: 02-login-form-filled.png');

    // Click sign in button
    console.log('Step 5: Clicking Sign in button...');
    const signInButton = await page.$('button[type="submit"]');
    if (!signInButton) {
      // Try alternative selectors
      const altButton = await page.$('button:contains("Sign in")') || 
                       await page.$('button:contains("Login")') ||
                       await page.$('button');
      if (altButton) {
        await altButton.click();
      } else {
        throw new Error('Could not find sign in button');
      }
    } else {
      await signInButton.click();
    }

    // Wait for navigation or response
    console.log('Step 6: Waiting for page to load after login...');
    try {
      await page.waitForNavigation({ 
        waitUntil: 'networkidle0',
        timeout: 10000 
      });
    } catch (e) {
      // Sometimes there's no navigation, just DOM changes
      await page.waitForTimeout(3000);
    }

    // Take screenshot after login
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-login.png'),
      fullPage: true
    });
    console.log('Screenshot taken: 03-after-login.png');

    // Check what's visible after login
    console.log('Step 7: Checking page content...');
    
    // Check for admin dashboard elements
    const checks = {
      adminTitle: await page.$('h1:contains("Admin"), h2:contains("Admin"), [class*="admin" i]'),
      userStats: await page.$$('[class*="stat" i], [class*="card" i]'),
      userTable: await page.$('table, [class*="table" i]'),
      errorMessage: await page.$('[class*="error" i], [class*="alert" i]'),
      dashboardText: await page.$eval('body', el => el.innerText.toLowerCase().includes('dashboard')),
      usersText: await page.$eval('body', el => el.innerText.toLowerCase().includes('user'))
    };

    console.log('\n=== Login Results ===');
    console.log('Found admin title element:', !!checks.adminTitle);
    console.log('Number of stat/card elements:', checks.userStats.length);
    console.log('Found user table:', !!checks.userTable);
    console.log('Found error message:', !!checks.errorMessage);
    console.log('Page contains "dashboard" text:', checks.dashboardText);
    console.log('Page contains "user" text:', checks.usersText);

    // Get page title and URL
    const pageTitle = await page.title();
    const pageUrl = page.url();
    console.log('\nPage title:', pageTitle);
    console.log('Current URL:', pageUrl);

    // Get visible text content (first 500 chars)
    const pageText = await page.$eval('body', el => el.innerText);
    console.log('\nPage content preview (first 500 chars):');
    console.log(pageText.substring(0, 500));

    // Take final screenshot of admin area
    if (pageUrl.includes('admin') && !pageUrl.includes('login')) {
      await page.screenshot({
        path: path.join(screenshotsDir, '04-admin-page.png'),
        fullPage: true
      });
      console.log('\nScreenshot taken: 04-admin-page.png');
    }

    // Assert login was successful
    expect(pageUrl).not.toContain('login');
    expect(checks.userStats.length).toBeGreaterThan(0);
  }, 60000); // 60 second timeout for the entire test
});