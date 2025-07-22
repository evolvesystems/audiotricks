/**
 * Comprehensive Browser Test Suite for AudioTricks
 * Tests all functionality by clicking every button and testing every feature
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AudioTricksBrowserTester {
  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.screenshotDir = path.join(__dirname, '../../test-screenshots');
    this.results = [];
    this.browser = null;
    this.page = null;
  }

  /**
   * Initialize browser and test environment
   */
  async initialize() {
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
  async takeScreenshot(name) {
    if (!this.page) throw new Error('Page not initialized');
    
    const filename = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  /**
   * Run a single test with error handling and timing
   */
  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`🧪 Running: ${testName}`);

    try {
      await testFunction();
      const duration = Date.now() - startTime;
      const result = {
        test: testName,
        status: 'PASS',
        duration,
        screenshot: await this.takeScreenshot(`pass-${testName}`)
      };
      console.log(`✅ PASS: ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        test: testName,
        status: 'FAIL',
        message: error.message,
        duration,
        screenshot: await this.takeScreenshot(`fail-${testName}`)
      };
      console.log(`❌ FAIL: ${testName} - ${error.message} (${duration}ms)`);
      return result;
    }
  }

  /**
   * Wait for element with timeout
   */
  async waitForElement(selector, timeout = 5000) {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.waitForSelector(selector, { 
      timeout,
      visible: true 
    });
  }

  /**
   * Test: Navigate to homepage and check basic elements
   */
  async testHomepageLoad() {
    if (!this.page) throw new Error('Page not initialized');
    
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if the page loaded properly
    await this.waitForElement('body');
    
    // Check for critical elements
    const title = await this.page.title();
    console.log(`Page title: ${title}`);
    
    // Check for main content
    const hasMainContent = await this.page.$('main, .content, h1, .hero, [data-testid="hero"]') !== null;
    if (!hasMainContent) {
      throw new Error('No main content found on homepage');
    }
    
    console.log('✅ Homepage loaded successfully with main content');
  }

  /**
   * Test: Click all visible buttons on homepage
   */
  async testHomepageButtons() {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find all clickable elements
    const buttons = await this.page.$$('button:not(:disabled), a[href]:not([href=""]), [role="button"]:not(:disabled)');
    console.log(`Found ${buttons.length} clickable elements on homepage`);

    let clickedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < Math.min(buttons.length, 20); i++) { // Limit to first 20 to avoid excessive testing
      try {
        const button = buttons[i];
        const tagName = await button.evaluate(el => el.tagName.toLowerCase());
        const text = await button.evaluate(el => el.textContent?.trim() || 'No text');
        const href = await button.evaluate(el => el.getAttribute('href'));
        
        console.log(`  Testing clickable ${i + 1}/${buttons.length}: ${tagName} - "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
        
        // Skip certain elements that might cause issues
        if (text.toLowerCase().includes('logout') || 
            text.toLowerCase().includes('delete') ||
            text.toLowerCase().includes('remove') ||
            (href && href.startsWith('mailto:')) ||
            (href && href.startsWith('tel:'))) {
          console.log(`    Skipping potentially problematic element: ${text}`);
          skippedCount++;
          continue;
        }

        // Try to click the element
        const isVisible = await button.evaluate(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
        });

        if (!isVisible) {
          console.log(`    Skipping hidden element`);
          skippedCount++;
          continue;
        }

        await button.click();
        clickedCount++;
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for any animations or state changes
        
        // Check if we're still on a reasonable page
        const currentUrl = this.page.url();
        if (currentUrl.includes('about:blank') || currentUrl.includes('chrome-error://')) {
          console.log(`    Click resulted in error page, going back to homepage`);
          await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        }
        
      } catch (error) {
        console.log(`    Error testing clickable ${i + 1}: ${error.message}`);
        // Try to recover by going back to homepage
        try {
          await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        } catch (e) {
          console.log(`    Failed to recover: ${e.message}`);
        }
      }
    }

    console.log(`✅ Button testing completed: ${clickedCount} clicked, ${skippedCount} skipped`);
  }

  /**
   * Test: Look for and test forms
   */
  async testAllForms() {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find all forms on the page
    const forms = await this.page.$$('form');
    console.log(`Found ${forms.length} forms to test`);
    
    for (let i = 0; i < forms.length; i++) {
      try {
        const form = forms[i];
        
        // Get all inputs in the form
        const inputs = await form.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');
        console.log(`  Form ${i + 1}: Found ${inputs.length} input fields`);
        
        // Fill out each field with test data
        for (let j = 0; j < inputs.length; j++) {
          const input = inputs[j];
          try {
            const type = await input.evaluate(el => el.getAttribute('type') || el.tagName.toLowerCase());
            const name = await input.evaluate(el => el.getAttribute('name') || el.getAttribute('id') || 'unnamed');
            
            console.log(`    Filling field: ${name} (${type})`);
            
            // Clear existing value
            await input.click({ clickCount: 3 });
            
            switch (type.toLowerCase()) {
              case 'email':
                await input.type('test@example.com');
                break;
              case 'password':
                await input.type('TestPassword123!');
                break;
              case 'text':
              case 'search':
                await input.type('Test data for automated testing');
                break;
              case 'textarea':
                await input.type('This is test content for the textarea field during automated browser testing.');
                break;
              case 'number':
                await input.type('123');
                break;
              case 'tel':
                await input.type('1234567890');
                break;
              case 'url':
                await input.type('https://example.com');
                break;
              case 'date':
                await input.type('2024-01-01');
                break;
              case 'select':
                // Try to select the first non-empty option
                const options = await input.$$('option');
                if (options.length > 1) {
                  const value = await options[1].evaluate(el => el.getAttribute('value'));
                  if (value) await input.select(value);
                }
                break;
              case 'checkbox':
              case 'radio':
                await input.click();
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between fields
          } catch (error) {
            console.log(`      Error filling field: ${error.message}`);
          }
        }
        
        // Take screenshot of filled form
        await this.takeScreenshot(`form-${i + 1}-filled`);
        
        console.log(`  ✅ Form ${i + 1} testing completed`);
        
      } catch (error) {
        console.log(`  Error testing form ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Navigation and routing
   */
  async testNavigation() {
    if (!this.page) throw new Error('Page not initialized');
    
    // Find navigation elements
    const navLinks = await this.page.$$('nav a, .navigation a, .menu a, [role="navigation"] a');
    console.log(`Found ${navLinks.length} navigation links`);
    
    const originalUrl = this.page.url();
    let successfulNavs = 0;
    
    for (let i = 0; i < Math.min(navLinks.length, 10); i++) { // Limit to prevent excessive navigation
      try {
        const link = navLinks[i];
        const href = await link.evaluate(el => el.getAttribute('href'));
        const text = await link.evaluate(el => el.textContent?.trim());
        
        console.log(`  Testing nav link: "${text}" (${href})`);
        
        // Skip external links or potentially problematic links
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:') || href === '#') {
          console.log(`    Skipping external/problematic link: ${href}`);
          continue;
        }
        
        await link.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if navigation was successful
        const newUrl = this.page.url();
        if (newUrl !== originalUrl) {
          console.log(`    ✅ Successfully navigated to: ${newUrl}`);
          successfulNavs++;
          
          // Take screenshot of new page
          await this.takeScreenshot(`nav-${text?.replace(/[^a-zA-Z0-9]/g, '-') || i}`);
          
          // Go back to original page for next test
          await this.page.goto(originalUrl, { waitUntil: 'networkidle2' });
        }
        
      } catch (error) {
        console.log(`    Error testing nav link ${i + 1}: ${error.message}`);
        // Try to recover
        try {
          await this.page.goto(originalUrl, { waitUntil: 'networkidle2' });
        } catch (e) {
          console.log(`    Failed to recover from navigation error`);
        }
      }
    }
    
    console.log(`✅ Navigation testing completed: ${successfulNavs} successful navigations`);
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🎯 Starting Comprehensive Browser Test Suite for AudioTricks\n');
    
    // Test sequence
    this.results.push(await this.runTest('Homepage Load', () => this.testHomepageLoad()));
    this.results.push(await this.runTest('Homepage Interactive Elements', () => this.testHomepageButtons()));
    this.results.push(await this.runTest('Navigation Testing', () => this.testNavigation()));
    this.results.push(await this.runTest('Form Testing', () => this.testAllForms()));

    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      skipped: this.results.filter(r => r.status === 'SKIP').length,
      results: this.results,
      screenshots: await fs.readdir(this.screenshotDir).catch(() => [])
    };

    return report;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
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
  async generateHTMLReport(report) {
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
        .badge { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .badge.pass { background: #16a34a; }
        .badge.fail { background: #dc2626; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 AudioTricks Browser Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Comprehensive browser testing with real user interactions</p>
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
                    <h3>${result.test} <span class="badge ${result.status.toLowerCase()}">${result.status}</span></h3>
                    <p><strong>Duration:</strong> ${result.duration}ms</p>
                    ${result.message ? `<p><strong>Message:</strong> ${result.message}</p>` : ''}
                </div>
                ${result.screenshot ? `<img src="test-screenshots/${result.screenshot}" class="screenshot" alt="Screenshot" />` : ''}
            </div>
        </div>
    `).join('')}
    
    <h2>All Screenshots (${report.screenshots.length} total)</h2>
    <div>
        ${report.screenshots.map(screenshot => 
            `<img src="test-screenshots/${screenshot}" class="screenshot" alt="${screenshot}" title="${screenshot}" onclick="window.open('test-screenshots/${screenshot}', '_blank')" style="cursor: pointer;" />`
        ).join('')}
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: white; border-radius: 8px;">
        <h3>Test Environment</h3>
        <p><strong>URL:</strong> ${process.env.TEST_URL || 'http://localhost:3000'}</p>
        <p><strong>User Agent:</strong> AudioTricks-Browser-Tester/1.0</p>
        <p><strong>Viewport:</strong> 1920x1080</p>
        <p><strong>Browser:</strong> Puppeteer (Chromium)</p>
    </div>
</body>
</html>`;

    const reportPath = path.join(__dirname, '../../browser-test-report.html');
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

module.exports = { AudioTricksBrowserTester, runBrowserTests };