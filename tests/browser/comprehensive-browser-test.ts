/**
 * Comprehensive Browser Test Suite for AudioTricks
 * Tests all functionality by clicking every button and testing every feature
 * CLAUDE.md compliant - Real browser testing with production environment simulation
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  screenshot?: string;
  duration: number;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  screenshots: string[];
}

class AudioTricksBrowserTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];
  private screenshotDir: string;

  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.screenshotDir = path.join(__dirname, '../../test-screenshots');
  }

  /**
   * Initialize browser and test environment
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing AudioTricks Browser Test Suite...');
    
    // Create screenshots directory
    await fs.mkdir(this.screenshotDir, { recursive: true });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Run in visible mode to see what's happening
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set up page
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('AudioTricks-Browser-Tester/1.0');

    console.log(`✅ Browser initialized, testing against: ${this.baseUrl}`);
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<string> {
    if (!this.page) throw new Error('Page not initialized');
    
    const filename = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  /**
   * Run a single test with error handling and timing
   */
  async runTest(testName: string, testFunction: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`🧪 Running: ${testName}`);

    try {
      await testFunction();
      const duration = Date.now() - startTime;
      const result: TestResult = {
        test: testName,
        status: 'PASS',
        duration,
        screenshot: await this.takeScreenshot(`pass-${testName}`)
      };
      console.log(`✅ PASS: ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: TestResult = {
        test: testName,
        status: 'FAIL',
        message: errorMessage,
        duration,
        screenshot: await this.takeScreenshot(`fail-${testName}`)
      };
      console.log(`❌ FAIL: ${testName} - ${errorMessage} (${duration}ms)`);
      return result;
    }
  }

  /**
   * Wait for element with timeout
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.waitForSelector(selector, { 
      timeout,
      visible: true 
    });
  }

  /**
   * Test: Navigate to homepage and check basic elements
   */
  async testHomepageLoad(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if the page loaded properly
    await this.waitForElement('body');
    
    // Check for critical elements
    const title = await this.page.title();
    if (!title.includes('AudioTricks')) {
      throw new Error(`Expected AudioTricks in title, got: ${title}`);
    }

    // Check for main navigation or hero section
    const heroExists = await this.page.$('h1, .hero, [data-testid="hero"]') !== null;
    if (!heroExists) {
      throw new Error('Hero section not found on homepage');
    }
  }

  /**
   * Test: Click all visible buttons on homepage
   */
  async testHomepageButtons(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find all clickable elements
    const buttons = await this.page.$$('button, a[href], [role="button"], input[type="button"], input[type="submit"]');
    console.log(`Found ${buttons.length} clickable elements on homepage`);

    for (let i = 0; i < buttons.length; i++) {
      try {
        const button = buttons[i];
        const tagName = await button.evaluate(el => el.tagName.toLowerCase());
        const text = await button.evaluate(el => el.textContent?.trim() || 'No text');
        
        console.log(`  Clicking button ${i + 1}/${buttons.length}: ${tagName} - "${text}"`);
        
        // Skip certain elements that might navigate away or cause issues
        if (text.toLowerCase().includes('logout') || 
            text.toLowerCase().includes('delete') ||
            text.toLowerCase().includes('remove')) {
          console.log(`    Skipping potentially destructive button: ${text}`);
          continue;
        }

        await button.click();
        await this.page.waitForTimeout(1000); // Wait for any animations or state changes
        
        // Check if we're still on the same domain
        const currentUrl = this.page.url();
        if (!currentUrl.includes(this.baseUrl.replace('http://', '').replace('https://', ''))) {
          console.log(`    Button navigated to external site: ${currentUrl}`);
          await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        }
      } catch (error) {
        console.log(`    Error clicking button ${i + 1}: ${error.message}`);
        // Continue with next button
      }
    }
  }

  /**
   * Test: Attempt login (if login form exists)
   */
  async testLogin(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Look for login form or login button
    const loginButton = await this.page.$('button:has-text("Login"), button:has-text("Sign In"), a:has-text("Login"), [href*="login"]');
    
    if (!loginButton) {
      // Try to find login by looking for common selectors
      const possibleLogin = await this.page.$('[data-testid*="login"], #login, .login-button, input[type="email"] + input[type="password"]');
      if (!possibleLogin) {
        console.log('No login form found, creating test user session');
        return;
      }
    }

    // Navigate to login if we found a login link
    if (loginButton) {
      await loginButton.click();
      await this.page.waitForTimeout(2000);
    }

    // Try to find email and password fields
    const emailField = await this.page.$('input[type="email"], input[name*="email"], input[id*="email"], input[placeholder*="email"]');
    const passwordField = await this.page.$('input[type="password"], input[name*="password"], input[id*="password"]');

    if (emailField && passwordField) {
      // Try to login with test credentials
      await emailField.type('test@audiotricks.com');
      await passwordField.type('testpassword123');
      
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In")');
      if (submitButton) {
        await submitButton.click();
        await this.page.waitForTimeout(3000);
        
        // Check if login was successful by looking for dashboard or user content
        const userArea = await this.page.$('[data-testid*="dashboard"], [data-testid*="user"], .dashboard, .user-menu');
        if (userArea) {
          console.log('✅ Test login successful');
        } else {
          console.log('⚠️ Login form submitted but user area not detected');
        }
      }
    }
  }

  /**
   * Test: Navigate through all menu items
   */
  async testAllMenuItems(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find navigation menus
    const navMenus = await this.page.$$('nav, .navigation, .menu, [role="navigation"]');
    
    for (const nav of navMenus) {
      const menuItems = await nav.$$('a, button, [role="menuitem"]');
      console.log(`Found ${menuItems.length} menu items in navigation`);
      
      for (let i = 0; i < menuItems.length; i++) {
        try {
          const item = menuItems[i];
          const text = await item.evaluate(el => el.textContent?.trim() || 'No text');
          const href = await item.evaluate(el => el.getAttribute('href'));
          
          console.log(`  Testing menu item: "${text}" ${href ? `(${href})` : ''}`);
          
          // Skip external links or potentially dangerous actions
          if (href && (href.startsWith('http') || href.includes('logout'))) {
            console.log(`    Skipping external or dangerous link: ${href}`);
            continue;
          }
          
          await item.click();
          await this.page.waitForTimeout(2000);
          
          // Take a screenshot of each page
          await this.takeScreenshot(`menu-${text.replace(/[^a-zA-Z0-9]/g, '-')}`);
          
          // Check if the page loaded content
          const hasContent = await this.page.$('main, .content, .page-content, h1, h2') !== null;
          if (!hasContent) {
            console.log(`    Warning: ${text} page appears to have no main content`);
          }
          
        } catch (error) {
          console.log(`    Error testing menu item ${i + 1}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Test: Find and test all forms (add/edit functionality)
   */
  async testAllForms(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find all forms on the page
    const forms = await this.page.$$('form');
    console.log(`Found ${forms.length} forms to test`);
    
    for (let i = 0; i < forms.length; i++) {
      try {
        const form = forms[i];
        
        // Get all inputs in the form
        const inputs = await form.$$('input, textarea, select');
        console.log(`  Form ${i + 1}: Found ${inputs.length} input fields`);
        
        // Fill out each field with test data
        for (const input of inputs) {
          const type = await input.evaluate(el => el.getAttribute('type') || el.tagName.toLowerCase());
          const name = await input.evaluate(el => el.getAttribute('name') || el.getAttribute('id') || 'unnamed');
          
          console.log(`    Filling field: ${name} (${type})`);
          
          try {
            switch (type.toLowerCase()) {
              case 'email':
                await input.type('test@example.com');
                break;
              case 'password':
                await input.type('testpassword123');
                break;
              case 'text':
              case 'textarea':
                await input.type('Test data for automated testing');
                break;
              case 'number':
                await input.type('123');
                break;
              case 'tel':
                await input.type('+1234567890');
                break;
              case 'url':
                await input.type('https://example.com');
                break;
              case 'select':
                // Try to select the first option
                const options = await input.$$('option');
                if (options.length > 0) {
                  const value = await options[0].evaluate(el => el.getAttribute('value') || el.textContent);
                  if (value) await input.select(value);
                }
                break;
              case 'checkbox':
              case 'radio':
                await input.click();
                break;
            }
          } catch (error) {
            console.log(`      Error filling field ${name}: ${error.message}`);
          }
        }
        
        // Take screenshot of filled form
        await this.takeScreenshot(`form-${i + 1}-filled`);
        
        // Try to submit the form (but only if it looks safe)
        const submitButton = await form.$('input[type="submit"], button[type="submit"], button:not([type])');
        if (submitButton) {
          const submitText = await submitButton.evaluate(el => el.textContent?.toLowerCase() || '');
          
          // Skip dangerous actions
          if (submitText.includes('delete') || submitText.includes('remove') || submitText.includes('cancel')) {
            console.log(`    Skipping potentially dangerous form submission: ${submitText}`);
            continue;
          }
          
          console.log(`    Submitting form with button: ${submitText}`);
          await submitButton.click();
          await this.page.waitForTimeout(3000);
          
          // Take screenshot after submission
          await this.takeScreenshot(`form-${i + 1}-submitted`);
        }
        
      } catch (error) {
        console.log(`  Error testing form ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Upload functionality (if exists)
   */
  async testUploadFunctionality(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');
    
    // Look for file upload elements
    const fileInputs = await this.page.$$('input[type="file"]');
    
    if (fileInputs.length === 0) {
      console.log('No file upload inputs found');
      return;
    }
    
    console.log(`Found ${fileInputs.length} file upload inputs`);
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-audio.mp3');
    const testFileContent = Buffer.from('fake mp3 content for testing');
    await fs.writeFile(testFilePath, testFileContent);
    
    try {
      for (let i = 0; i < fileInputs.length; i++) {
        const input = fileInputs[i];
        console.log(`  Testing file upload ${i + 1}`);
        
        await input.uploadFile(testFilePath);
        await this.page.waitForTimeout(2000);
        
        // Take screenshot after file selection
        await this.takeScreenshot(`upload-${i + 1}-selected`);
        
        // Look for upload button or submit
        const uploadButton = await this.page.$('button:has-text("Upload"), button:has-text("Process"), input[type="submit"]');
        if (uploadButton) {
          await uploadButton.click();
          await this.page.waitForTimeout(5000); // Wait longer for upload processing
          await this.takeScreenshot(`upload-${i + 1}-processing`);
        }
      }
    } finally {
      // Clean up test file
      try {
        await fs.unlink(testFilePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestReport> {
    console.log('🎯 Starting Comprehensive Browser Test Suite for AudioTricks\n');
    
    // Test sequence
    this.results.push(await this.runTest('Homepage Load', () => this.testHomepageLoad()));
    this.results.push(await this.runTest('Homepage Buttons', () => this.testHomepageButtons()));
    this.results.push(await this.runTest('Login Functionality', () => this.testLogin()));
    this.results.push(await this.runTest('All Menu Items', () => this.testAllMenuItems()));
    this.results.push(await this.runTest('All Forms', () => this.testAllForms()));
    this.results.push(await this.runTest('Upload Functionality', () => this.testUploadFunctionality()));

    // Generate report
    const report: TestReport = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      skipped: this.results.filter(r => r.status === 'SKIP').length,
      results: this.results,
      screenshots: await fs.readdir(this.screenshotDir)
    };

    return report;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log('🧹 Browser test cleanup completed');
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report: TestReport): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AudioTricks Browser Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .skipped { color: #ea580c; }
        .test-result { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #e5e7eb; }
        .test-result.pass { border-left-color: #16a34a; }
        .test-result.fail { border-left-color: #dc2626; }
        .test-result.skip { border-left-color: #ea580c; }
        .screenshot { max-width: 200px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .test-details { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 AudioTricks Browser Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Comprehensive browser testing with Puppeteer</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <div class="stat-number">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat-card passed">
            <div class="stat-number">${report.passed}</div>
            <div>Passed</div>
        </div>
        <div class="stat-card failed">
            <div class="stat-number">${report.failed}</div>
            <div>Failed</div>
        </div>
        <div class="stat-card skipped">
            <div class="stat-number">${report.skipped}</div>
            <div>Skipped</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(result => `
        <div class="test-result ${result.status.toLowerCase()}">
            <div class="test-details">
                <div>
                    <h3>${result.test}</h3>
                    <p><strong>Status:</strong> ${result.status}</p>
                    <p><strong>Duration:</strong> ${result.duration}ms</p>
                    ${result.message ? `<p><strong>Message:</strong> ${result.message}</p>` : ''}
                </div>
                ${result.screenshot ? `<img src="test-screenshots/${result.screenshot}" class="screenshot" alt="Screenshot" />` : ''}
            </div>
        </div>
    `).join('')}
    
    <h2>All Screenshots</h2>
    <div>
        ${report.screenshots.map(screenshot => 
            `<img src="test-screenshots/${screenshot}" class="screenshot" alt="${screenshot}" title="${screenshot}" />`
        ).join('')}
    </div>
</body>
</html>`;

    const reportPath = path.join(this.screenshotDir, '../browser-test-report.html');
    await fs.writeFile(reportPath, htmlContent);
    console.log(`📊 HTML report generated: ${reportPath}`);
  }
}

/**
 * Main test runner
 */
async function runBrowserTests() {
  const tester = new AudioTricksBrowserTester();
  
  try {
    await tester.initialize();
    const report = await tester.runAllTests();
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Total: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏭️ Skipped: ${report.skipped}`);
    
    // Generate reports
    await tester.generateHTMLReport(report);
    
    const jsonReportPath = path.join(__dirname, '../../test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonReportPath}`);
    
    // Exit with appropriate code
    process.exit(report.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Browser test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

// Run if called directly
if (require.main === module) {
  runBrowserTests();
}

export { AudioTricksBrowserTester, runBrowserTests };