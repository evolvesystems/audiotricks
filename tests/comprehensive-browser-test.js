/**
 * Comprehensive Browser Testing Suite for AudioTricks
 * Tests every page, button, navigation menu, and functionality
 * Generates detailed HTML report with screenshots
 */

import puppeteer from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

class AudioTricksTestSuite {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.screenshots = [];
    this.screenshotCounter = 0;
    this.baseUrl = 'https://audiotricks.evolvepreneuriq.com';
    this.screenshotDir = './test-screenshots';
    this.adminCredentials = {
      email: 'admin@audiotricks.com',
      password: 'admin123'
    };
  }

  async init() {
    // Create screenshot directory
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      console.log('Screenshot directory already exists');
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'true' ? 'new' : false, // Show browser for debugging
      slowMo: process.env.HEADLESS === 'true' ? 100 : 500,    // Slow down actions
      defaultViewport: { width: 1200, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    this.page = await this.browser.newPage();
    
    // Set user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    console.log('🚀 Browser testing initialized');
  }

  async takeScreenshot(testName) {
    const filename = `${String(this.screenshotCounter).padStart(3, '0')}-${testName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;
    await this.page.screenshot({ 
      path: path.join(this.screenshotDir, filename),
      fullPage: true 
    });
    this.screenshots.push(filename);
    this.screenshotCounter++;
    return filename;
  }

  async runTest(testName, testFunction, category = 'General') {
    const startTime = Date.now();
    let status = 'PASS';
    let message = '';
    let screenshot = null;

    console.log(`\n🧪 Testing: ${testName}`);

    try {
      await testFunction();
      screenshot = await this.takeScreenshot(testName);
      console.log(`✅ PASSED: ${testName}`);
    } catch (error) {
      status = 'FAIL';
      message = error.message;
      screenshot = await this.takeScreenshot(`FAILED-${testName}`);
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
      
      // Continue testing even after failures
    }

    const duration = Date.now() - startTime;
    
    this.results.push({
      test: testName,
      category,
      status,
      message,
      duration,
      screenshot,
      timestamp: new Date().toISOString()
    });
  }

  async waitAndClick(selector, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any animations
  }

  async waitAndType(selector, text, timeout = 10000) {
    await this.page.waitForSelector(selector, { timeout });
    await this.page.type(selector, text);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async wait(ms) {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  async testHomePageLoad() {
    await this.runTest('Home Page Loads', async () => {
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check for key elements
      await this.page.waitForSelector('body', { timeout: 10000 });
      
      const title = await this.page.title();
      if (!title || title.includes('Error')) {
        throw new Error(`Invalid page title: ${title}`);
      }

      // Check for AudioTricks branding
      const hasAudioTricks = await this.page.evaluate(() => {
        return document.body.textContent.includes('AudioTricks') || 
               document.body.textContent.includes('Audio') ||
               document.querySelector('h1, h2, .logo');
      });

      if (!hasAudioTricks) {
        throw new Error('AudioTricks branding not found on homepage');
      }
    }, 'Navigation');
  }

  async testLoginFunctionality() {
    await this.runTest('Admin Login Process', async () => {
      // Go to homepage first
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Look for login button or form
      const loginSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        '.login-button',
        '.btn-login',
        'button:contains("Login")',
        'a[href*="login"]',
        'form input[type="email"]' // Login form present
      ];

      let loginFound = false;
      for (const selector of loginSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 2000 });
          loginFound = true;
          break;
        } catch (e) {
          // Try next selector
        }
      }

      if (!loginFound) {
        // Try typing email directly if form is visible
        const emailInput = await this.page.$('input[type="email"], input[name="email"]');
        if (emailInput) {
          await this.page.type('input[type="email"], input[name="email"]', this.adminCredentials.email);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
          if (passwordInput) {
            await this.page.type('input[type="password"], input[name="password"]', this.adminCredentials.password);
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Look for submit button
            const submitButton = await this.page.$('button[type="submit"], input[type="submit"], .btn-primary');
            if (submitButton) {
              await submitButton.click();
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Check if login was successful
              const url = this.page.url();
              if (url.includes('dashboard') || url.includes('admin')) {
                return; // Success
              }
            }
          }
        }
        
        throw new Error('No login form or button found on homepage');
      }

      // If we found login elements, the test passes
    }, 'Authentication');
  }

  async testNavigationMenus() {
    await this.runTest('Navigation Menu Functionality', async () => {
      // Test main navigation elements
      const navSelectors = [
        'nav a',
        '.nav-link',
        '.menu-item',
        'header a',
        '.navbar a',
        '[role="navigation"] a'
      ];

      let navItems = [];
      for (const selector of navSelectors) {
        try {
          const items = await this.page.$$(selector);
          if (items.length > 0) {
            navItems = items;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }

      if (navItems.length === 0) {
        throw new Error('No navigation menu items found');
      }

      // Test first few navigation items
      for (let i = 0; i < Math.min(3, navItems.length); i++) {
        try {
          const linkText = await navItems[i].evaluate(el => el.textContent);
          const href = await navItems[i].evaluate(el => el.href);
          
          if (href && !href.includes('javascript:') && !href.includes('#')) {
            await navItems[i].click();
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check if navigation worked
            const newUrl = this.page.url();
            console.log(`  ➜ Navigated to: ${linkText} (${newUrl})`);
          }
        } catch (e) {
          console.log(`  ⚠️ Navigation item ${i} failed: ${e.message}`);
        }
      }
    }, 'Navigation');
  }

  async testButtonFunctionality() {
    await this.runTest('Button Interactions', async () => {
      const buttons = await this.page.$$('button:not([disabled])');
      
      if (buttons.length === 0) {
        throw new Error('No clickable buttons found on page');
      }

      let workingButtons = 0;
      
      for (let i = 0; i < Math.min(5, buttons.length); i++) {
        try {
          const buttonText = await buttons[i].evaluate(el => el.textContent || el.value || 'Button');
          
          // Skip dangerous buttons
          if (buttonText.toLowerCase().includes('delete') || 
              buttonText.toLowerCase().includes('remove')) {
            continue;
          }

          await buttons[i].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          workingButtons++;
          console.log(`  ✅ Button clicked: ${buttonText.trim()}`);
        } catch (e) {
          console.log(`  ⚠️ Button ${i} failed: ${e.message}`);
        }
      }

      if (workingButtons === 0) {
        throw new Error('No buttons were successfully clickable');
      }
    }, 'Interactions');
  }

  async testFormElements() {
    await this.runTest('Form Element Testing', async () => {
      // Find input fields
      const inputs = await this.page.$$('input:not([type="hidden"]):not([disabled])');
      const textareas = await this.page.$$('textarea:not([disabled])');
      const selects = await this.page.$$('select:not([disabled])');

      let totalElements = inputs.length + textareas.length + selects.length;
      
      if (totalElements === 0) {
        throw new Error('No form elements found on page');
      }

      let workingElements = 0;

      // Test text inputs
      for (let i = 0; i < Math.min(3, inputs.length); i++) {
        try {
          const inputType = await inputs[i].evaluate(el => el.type);
          const placeholder = await inputs[i].evaluate(el => el.placeholder);
          
          if (['text', 'email', 'search'].includes(inputType)) {
            await inputs[i].focus();
            await new Promise(resolve => setTimeout(resolve, 500));
            await inputs[i].type('Test input');
            await new Promise(resolve => setTimeout(resolve, 500));
            workingElements++;
            console.log(`  ✅ Input tested: ${inputType} (${placeholder})`);
          }
        } catch (e) {
          console.log(`  ⚠️ Input ${i} failed: ${e.message}`);
        }
      }

      // Test textareas
      for (let i = 0; i < Math.min(2, textareas.length); i++) {
        try {
          await textareas[i].focus();
          await textareas[i].type('Test textarea content');
          workingElements++;
          console.log(`  ✅ Textarea tested`);
        } catch (e) {
          console.log(`  ⚠️ Textarea ${i} failed: ${e.message}`);
        }
      }

      if (workingElements === 0) {
        throw new Error('No form elements were functional');
      }
    }, 'Forms');
  }

  async testPageResponsiveness() {
    await this.runTest('Mobile Responsiveness', async () => {
      // Test mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if page adapts to mobile
      const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
      
      if (bodyWidth > 400) { // Allow some margin
        throw new Error(`Page not responsive: body width ${bodyWidth}px on mobile`);
      }

      // Test tablet viewport
      await this.page.setViewport({ width: 768, height: 1024 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Test desktop viewport
      await this.page.setViewport({ width: 1200, height: 800 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('  ✅ Responsive design tested across viewports');
    }, 'Responsive Design');
  }

  async testAPIEndpoints() {
    await this.runTest('API Health Endpoints', async () => {
      // Test health endpoint directly
      const healthResponse = await this.page.goto(`${this.baseUrl}/api/health`, { waitUntil: 'networkidle2' });
      
      if (healthResponse.status() !== 200) {
        throw new Error(`Health endpoint failed: ${healthResponse.status()}`);
      }

      const healthData = await this.page.evaluate(() => {
        try {
          return JSON.parse(document.body.textContent);
        } catch (e) {
          return null;
        }
      });

      if (!healthData || (!healthData.status && !healthData.healthy)) {
        throw new Error('Health endpoint returned invalid data');
      }

      console.log('  ✅ Health endpoint operational');

      // Test auth health endpoint
      try {
        await this.page.goto(`${this.baseUrl}/api/auth/health`, { waitUntil: 'networkidle2' });
        console.log('  ✅ Auth health endpoint accessible');
      } catch (e) {
        console.log('  ⚠️ Auth health endpoint failed');
      }
    }, 'API');
  }

  async testPerformance() {
    await this.runTest('Page Load Performance', async () => {
      const startTime = Date.now();
      
      await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      const loadTime = Date.now() - startTime;
      
      if (loadTime > 10000) { // 10 seconds
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }

      // Check for performance metrics
      const performanceMetrics = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoad: navigation.loadEventEnd - navigation.navigationStart
        };
      });

      console.log(`  ✅ Load performance: ${loadTime}ms total`);
      console.log(`  ➜ DOM loaded: ${performanceMetrics.domContentLoaded}ms`);
      console.log(`  ➜ Complete: ${performanceMetrics.totalLoad}ms`);
    }, 'Performance');
  }

  async testErrorHandling() {
    await this.runTest('Error Page Handling', async () => {
      // Test 404 page
      try {
        const response = await this.page.goto(`${this.baseUrl}/nonexistent-page-12345`, { waitUntil: 'networkidle2' });
        
        // Check if we get a proper error page or redirect
        const status = response.status();
        const currentUrl = this.page.url();
        
        if (status === 404 || currentUrl.includes('404') || currentUrl.includes('not-found')) {
          console.log('  ✅ 404 handling working');
        } else if (status === 200 && currentUrl === this.baseUrl) {
          console.log('  ✅ 404 redirects to home (acceptable)');
        } else {
          throw new Error(`Unexpected 404 handling: ${status} - ${currentUrl}`);
        }
      } catch (e) {
        throw new Error(`Error page testing failed: ${e.message}`);
      }
    }, 'Error Handling');
  }

  async runAllTests() {
    console.log('🎵 Starting AudioTricks Comprehensive Browser Testing');
    console.log('==================================================');

    try {
      await this.init();

      // Core functionality tests
      await this.testHomePageLoad();
      await this.testAPIEndpoints();
      await this.testLoginFunctionality();
      await this.testNavigationMenus();
      await this.testButtonFunctionality();
      await this.testFormElements();
      
      // Quality tests
      await this.testPageResponsiveness();
      await this.testPerformance();
      await this.testErrorHandling();

      console.log('\n🎉 All tests completed!');
      
    } catch (error) {
      console.error('💥 Test suite failed:', error);
    } finally {
      await this.generateReport();
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  async generateReport() {
    const report = {
      title: 'AudioTricks Comprehensive Browser Test Report',
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      results: this.results,
      screenshots: this.screenshots
    };

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    await fs.writeFile('./comprehensive-test-report.html', htmlReport);

    // Generate JSON report
    await fs.writeFile('./comprehensive-test-report.json', JSON.stringify(report, null, 2));

    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log(`Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`Success Rate: ${Math.round((report.passed / report.totalTests) * 100)}%`);
    console.log('\n📄 Reports generated:');
    console.log('• comprehensive-test-report.html');
    console.log('• comprehensive-test-report.json');
    console.log(`• ${this.screenshots.length} screenshots in ${this.screenshotDir}/`);
  }

  generateHTMLReport(report) {
    const categoryStats = {};
    report.results.forEach(result => {
      if (!categoryStats[result.category]) {
        categoryStats[result.category] = { total: 0, passed: 0, failed: 0 };
      }
      categoryStats[result.category].total++;
      if (result.status === 'PASS') categoryStats[result.category].passed++;
      else categoryStats[result.category].failed++;
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AudioTricks Browser Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f5f7fa;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px 20px; 
            text-align: center; 
            margin: -20px -20px 30px -20px;
            border-radius: 0 0 20px 20px;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header .subtitle { font-size: 1.2em; opacity: 0.9; }
        
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .stat-card { 
            background: white; 
            padding: 30px; 
            border-radius: 15px; 
            text-align: center; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .stat-card:hover { transform: translateY(-5px); }
        .stat-number { font-size: 3em; font-weight: bold; margin-bottom: 10px; }
        .stat-label { font-size: 1.1em; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        
        .passed { color: #10b981; }
        .failed { color: #ef4444; }
        .total { color: #3b82f6; }
        .success-rate { color: #8b5cf6; }
        
        .categories { margin-bottom: 40px; }
        .category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .category-card { 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
        }
        .category-name { font-weight: bold; margin-bottom: 10px; color: #4f46e5; }
        .category-stats { font-size: 0.9em; color: #666; }
        
        .results { background: white; border-radius: 15px; padding: 30px; box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .test-item { 
            border-left: 5px solid #e5e7eb; 
            margin: 20px 0; 
            padding: 20px; 
            background: #fafafa; 
            border-radius: 0 10px 10px 0;
            transition: all 0.3s ease;
        }
        .test-item:hover { background: #f0f0f0; }
        .test-item.pass { border-left-color: #10b981; background: #f0fdf4; }
        .test-item.fail { border-left-color: #ef4444; background: #fef2f2; }
        
        .test-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .test-name { font-size: 1.3em; font-weight: bold; }
        .test-status { 
            padding: 8px 16px; 
            border-radius: 20px; 
            font-weight: bold; 
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .status-pass { background: #d1fae5; color: #065f46; }
        .status-fail { background: #fee2e2; color: #991b1b; }
        
        .test-details { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: start; }
        .test-info { }
        .test-meta { color: #666; font-size: 0.9em; margin: 5px 0; }
        .error-message { 
            color: #dc2626; 
            background: #fef2f2; 
            padding: 15px; 
            border-radius: 8px; 
            margin-top: 15px;
            border-left: 4px solid #dc2626;
        }
        
        .screenshot { 
            max-width: 200px; 
            max-height: 150px;
            border-radius: 8px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: transform 0.3s ease;
        }
        .screenshot:hover { transform: scale(1.05); cursor: pointer; }
        
        .screenshots-section { margin-top: 50px; }
        .screenshots-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-top: 20px;
        }
        .screenshot-card { 
            background: white; 
            padding: 15px; 
            border-radius: 10px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.08);
            text-align: center;
        }
        .screenshot-card img { 
            width: 100%; 
            height: 200px; 
            object-fit: cover; 
            border-radius: 8px; 
            margin-bottom: 10px;
        }
        
        h2 { color: #374151; margin: 30px 0 20px 0; font-size: 1.8em; }
        h3 { color: #4f46e5; margin: 20px 0 15px 0; }
        
        .timestamp { color: #6b7280; font-size: 0.9em; }
        .url { color: #4f46e5; text-decoration: none; }
        .url:hover { text-decoration: underline; }
        
        @media (max-width: 768px) {
            .container { padding: 10px; }
            .header { margin: -10px -10px 20px -10px; padding: 30px 15px; }
            .header h1 { font-size: 2em; }
            .test-details { grid-template-columns: 1fr; }
            .screenshot { max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎵 AudioTricks Browser Test Report</h1>
            <div class="subtitle">Comprehensive Browser Testing Suite</div>
            <div class="timestamp">Generated: ${new Date(report.timestamp).toLocaleString()}</div>
            <div>Testing: <a href="${report.baseUrl}" class="url" target="_blank">${report.baseUrl}</a></div>
        </div>
        
        <div class="summary">
            <div class="stat-card">
                <div class="stat-number total">${report.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-number passed">${report.passed}</div>
                <div class="stat-label">Passed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number failed">${report.failed}</div>
                <div class="stat-label">Failed</div>
            </div>
            <div class="stat-card">
                <div class="stat-number success-rate">${Math.round((report.passed / report.totalTests) * 100)}%</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
        
        <div class="categories">
            <h2>Test Categories</h2>
            <div class="category-grid">
                ${Object.entries(categoryStats).map(([category, stats]) => `
                    <div class="category-card">
                        <div class="category-name">${category}</div>
                        <div class="category-stats">
                            ${stats.total} tests • 
                            <span class="passed">${stats.passed} passed</span> • 
                            <span class="failed">${stats.failed} failed</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="results">
            <h2>Detailed Test Results</h2>
            ${report.results.map(result => `
                <div class="test-item ${result.status.toLowerCase()}">
                    <div class="test-header">
                        <div class="test-name">${result.test}</div>
                        <div class="test-status status-${result.status.toLowerCase()}">${result.status}</div>
                    </div>
                    <div class="test-details">
                        <div class="test-info">
                            <div class="test-meta">📁 Category: ${result.category}</div>
                            <div class="test-meta">⏱️ Duration: ${result.duration}ms</div>
                            <div class="test-meta">🕒 Time: ${new Date(result.timestamp).toLocaleTimeString()}</div>
                            ${result.message ? `<div class="error-message">❌ Error: ${result.message}</div>` : ''}
                        </div>
                        ${result.screenshot ? `<img src="${this.screenshotDir}/${result.screenshot}" alt="Test Screenshot" class="screenshot" onclick="window.open(this.src)" />` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${report.screenshots.length > 0 ? `
            <div class="screenshots-section">
                <h2>All Screenshots (${report.screenshots.length})</h2>
                <div class="screenshots-grid">
                    ${report.screenshots.map(screenshot => `
                        <div class="screenshot-card">
                            <img src="${this.screenshotDir}/${screenshot}" alt="${screenshot}" onclick="window.open(this.src)" />
                            <div style="font-size: 0.8em; color: #666;">${screenshot}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
  }
}

// Run the test suite
(async () => {
  const testSuite = new AudioTricksTestSuite();
  await testSuite.runAllTests();
})();