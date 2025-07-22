import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAdminLogin() {
  let browser;
  let page;

  try {
    // Create screenshots directory if it doesn't exist
    const screenshotsDir = path.join(__dirname, '../../screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });

    console.log('🚀 Starting Admin Login Test...\n');

    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to false to see the browser
      slowMo: 100, // Slow down actions by 100ms for visibility
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('📍 Step 1: Navigating to http://localhost:3000/admin');
    
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
    console.log('📸 Screenshot saved: 01-initial-page.png\n');

    // Wait for login form to load
    console.log('⏳ Step 2: Waiting for login form to load...');
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    await page.waitForSelector('input[type="password"]', { timeout: 5000 });
    console.log('✅ Login form loaded\n');
    
    // Fill in email field
    console.log('📧 Step 3: Filling email field with: test@example.com');
    await page.type('input[type="email"]', 'test@example.com');
    
    // Fill in password field
    console.log('🔑 Step 4: Filling password field with: TestPass123');
    await page.type('input[type="password"]', 'TestPass123');
    
    // Take screenshot with form filled
    await page.screenshot({
      path: path.join(screenshotsDir, '02-login-form-filled.png'),
      fullPage: true
    });
    console.log('📸 Screenshot saved: 02-login-form-filled.png\n');

    // Find and click sign in button
    console.log('🖱️ Step 5: Clicking Sign in button...');
    
    // Try multiple selectors for the button
    let clicked = false;
    
    // Method 1: button[type="submit"]
    const submitButton = await page.$('button[type="submit"]');
    if (submitButton) {
      await submitButton.click();
      clicked = true;
    }
    
    // Method 2: Look for button with text
    if (!clicked) {
      const buttons = await page.$$('button');
      for (const button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('Sign in') || text.includes('Login') || text.includes('Submit'))) {
          await button.click();
          clicked = true;
          break;
        }
      }
    }

    if (!clicked) {
      throw new Error('Could not find sign in button');
    }

    console.log('✅ Button clicked\n');

    // Wait for response
    console.log('⏳ Step 6: Waiting for page to load after login...');
    
    // Wait for either navigation or DOM changes
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    // Additional wait to ensure page is fully loaded
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot after login
    await page.screenshot({
      path: path.join(screenshotsDir, '03-after-login.png'),
      fullPage: true
    });
    console.log('📸 Screenshot saved: 03-after-login.png\n');

    // Check what's visible after login
    console.log('🔍 Step 7: Analyzing page content...\n');
    
    // Get page info
    const pageTitle = await page.title();
    const pageUrl = page.url();
    
    console.log('📄 Page Information:');
    console.log('   Title:', pageTitle);
    console.log('   URL:', pageUrl);
    console.log('');

    // Check for various elements
    console.log('🔎 Looking for admin dashboard elements...\n');

    // Check for user statistics cards
    const statCards = await page.$$('[class*="stat"], [class*="card"], [class*="metric"]');
    console.log(`📊 Statistics/Cards found: ${statCards.length}`);
    
    if (statCards.length > 0) {
      for (let i = 0; i < Math.min(3, statCards.length); i++) {
        const cardText = await statCards[i].evaluate(el => el.textContent?.trim());
        console.log(`   Card ${i + 1}: ${cardText?.substring(0, 50)}...`);
      }
    }

    // Check for user table
    const tables = await page.$$('table');
    console.log(`\n📋 Tables found: ${tables.length}`);
    
    if (tables.length > 0) {
      const headers = await page.$$eval('table th', elements => 
        elements.map(el => el.textContent?.trim()).filter(Boolean)
      );
      if (headers.length > 0) {
        console.log('   Table headers:', headers.join(', '));
      }
    }

    // Check for headings
    const headings = await page.$$eval('h1, h2, h3', elements => 
      elements.map(el => ({ tag: el.tagName, text: el.textContent?.trim() }))
        .filter(h => h.text)
        .slice(0, 5)
    );
    
    if (headings.length > 0) {
      console.log('\n📝 Page headings:');
      headings.forEach(h => {
        console.log(`   ${h.tag}: ${h.text}`);
      });
    }

    // Check for error messages
    const errorElements = await page.$$('[class*="error"], [class*="alert"], [role="alert"]');
    if (errorElements.length > 0) {
      console.log(`\n⚠️ Error/Alert elements found: ${errorElements.length}`);
      const errorText = await errorElements[0].evaluate(el => el.textContent?.trim());
      console.log(`   Error message: ${errorText}`);
    }

    // Get visible text preview
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('\n📄 Page content preview:');
    console.log('---');
    console.log(bodyText.substring(0, 500).replace(/\n\s*\n/g, '\n'));
    console.log('---\n');

    // Take final screenshot if we're in admin area
    if (pageUrl.includes('admin') && !pageUrl.includes('login')) {
      await page.screenshot({
        path: path.join(screenshotsDir, '04-admin-page.png'),
        fullPage: true
      });
      console.log('📸 Screenshot saved: 04-admin-page.png');
      console.log('\n✅ Login successful! You are now in the admin area.');
    } else if (pageUrl.includes('login')) {
      console.log('\n❌ Still on login page. Login may have failed.');
    } else {
      console.log('\n⚠️ Redirected to:', pageUrl);
    }

    console.log('\n🎯 Test completed! Check the screenshots folder for visual results.');

  } catch (error) {
    console.error('\n❌ Error during test:', error.message);
    
    // Try to capture error screenshot
    if (page) {
      try {
        await page.screenshot({
          path: path.join(__dirname, '../../screenshots/error-screenshot.png'),
          fullPage: true
        });
        console.log('📸 Error screenshot saved: error-screenshot.png');
      } catch (screenshotError) {
        console.error('Could not capture error screenshot:', screenshotError.message);
      }
    }
    
    throw error;
  } finally {
    // Clean up
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
console.log('🎬 AudioTricks Admin Login Test\n');
testAdminLogin().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});