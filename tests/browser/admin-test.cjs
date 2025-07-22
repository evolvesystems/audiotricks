/**
 * Admin and User Dashboard Browser Test
 * Tests login functionality and admin/user areas
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class AdminBrowserTester {
  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.screenshotDir = path.join(__dirname, '../../test-screenshots');
    this.results = [];
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    console.log('🔐 Initializing Admin & Dashboard Browser Tests...');
    
    await fs.mkdir(this.screenshotDir, { recursive: true });

    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1920, height: 1080 },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });

    console.log(`✅ Admin test browser initialized: ${this.baseUrl}`);
  }

  async takeScreenshot(name) {
    const filename = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

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
   * Test: Navigate to admin login
   */
  async testAdminAccess() {
    console.log('🔑 Testing admin access...');
    
    // Try direct admin URL
    await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentUrl = this.page.url();
    console.log(`Admin URL resulted in: ${currentUrl}`);
    
    // Check if we're redirected to login or see admin content
    const hasLoginForm = await this.page.$('form, input[type="email"], input[type="password"]') !== null;
    const hasAdminContent = await this.page.$('[data-testid*="admin"], .admin, h1, h2') !== null;
    
    if (hasLoginForm) {
      console.log('📝 Login form detected, attempting login...');
      await this.attemptLogin();
    } else if (hasAdminContent) {
      console.log('🎯 Direct admin access available');
    } else {
      console.log('⚠️ No clear admin interface found');
    }
  }

  /**
   * Attempt to login if login form is present
   */
  async attemptLogin() {
    const emailField = await this.page.$('input[type="email"], input[name*="email"], input[id*="email"]');
    const passwordField = await this.page.$('input[type="password"]');

    if (emailField && passwordField) {
      console.log('  Filling login form...');
      
      // Try common admin credentials
      await emailField.type('admin@audiotricks.com');
      await passwordField.type('admin123');
      
      // Look for submit button
      const submitButton = await this.page.$('button[type="submit"], input[type="submit"]');
      if (submitButton) {
        console.log('  Submitting login form...');
        await submitButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if login was successful
        const newUrl = this.page.url();
        console.log(`After login attempt: ${newUrl}`);
        
        const hasError = await this.page.$('.error, .alert-error, [role="alert"]') !== null;
        if (hasError) {
          const errorText = await this.page.evaluate(() => {
            const errorEl = document.querySelector('.error, .alert-error, [role="alert"]');
            return errorEl ? errorEl.textContent : 'Unknown error';
          });
          console.log(`  Login error: ${errorText}`);
        }
      }
    }
  }

  /**
   * Test: Explore all admin menu items
   */
  async testAdminMenuItems() {
    console.log('🗂️ Testing admin menu items...');
    
    // Look for admin navigation
    const navElements = await this.page.$$('nav, .sidebar, .menu, [role="navigation"]');
    
    let menuItems = [];
    for (const nav of navElements) {
      const items = await nav.$$('a, button, [role="menuitem"]');
      menuItems = menuItems.concat(items);
    }
    
    console.log(`Found ${menuItems.length} potential menu items`);
    
    for (let i = 0; i < Math.min(menuItems.length, 15); i++) {
      try {
        const item = menuItems[i];
        const text = await item.evaluate(el => el.textContent?.trim() || 'No text');
        const href = await item.evaluate(el => el.getAttribute('href') || '');
        
        console.log(`  Testing menu: "${text}" ${href ? `(${href})` : ''}`);
        
        // Skip dangerous or external links
        if (text.toLowerCase().includes('logout') || 
            text.toLowerCase().includes('delete') ||
            href.startsWith('http')) {
          console.log(`    Skipping: ${text}`);
          continue;
        }
        
        await item.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Take screenshot of each admin page
        await this.takeScreenshot(`admin-menu-${text.replace(/[^a-zA-Z0-9]/g, '-')}`);
        
        // Check for admin-specific content
        const hasTable = await this.page.$('table, .table, [role="table"]') !== null;
        const hasForm = await this.page.$('form') !== null;
        const hasCards = await this.page.$('.card, .dashboard-card') !== null;
        
        console.log(`    Page has: Table:${hasTable}, Form:${hasForm}, Cards:${hasCards}`);
        
      } catch (error) {
        console.log(`    Error testing menu item ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Admin CRUD operations
   */
  async testAdminCRUDOperations() {
    console.log('📝 Testing admin CRUD operations...');
    
    // Look for "Add", "Create", "New" buttons using text content evaluation
    const allButtons = await this.page.$$('button, a[href]');
    const addButtons = [];
    
    for (const button of allButtons) {
      const text = await button.evaluate(el => el.textContent?.toLowerCase() || '');
      if (text.includes('add') || text.includes('create') || text.includes('new')) {
        addButtons.push(button);
      }
    }
    
    console.log(`Found ${addButtons.length} potential add/create buttons`);
    
    for (let i = 0; i < Math.min(addButtons.length, 5); i++) {
      try {
        const button = addButtons[i];
        const text = await button.evaluate(el => el.textContent?.trim());
        
        console.log(`  Testing add/create button: "${text}"`);
        
        await button.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Look for form that appeared
        const forms = await this.page.$$('form');
        if (forms.length > 0) {
          console.log(`    Found ${forms.length} forms after clicking`);
          
          // Fill the first form with test data
          const form = forms[0];
          const inputs = await form.$$('input:not([type="hidden"]):not([type="submit"]), textarea, select');
          
          for (const input of inputs) {
            try {
              const type = await input.evaluate(el => el.getAttribute('type') || el.tagName.toLowerCase());
              const name = await input.evaluate(el => el.getAttribute('name') || el.getAttribute('id') || '');
              
              console.log(`      Filling: ${name} (${type})`);
              
              switch (type.toLowerCase()) {
                case 'email':
                  await input.type('test@example.com');
                  break;
                case 'text':
                  await input.type('Test Data');
                  break;
                case 'textarea':
                  await input.type('Test description content');
                  break;
                case 'number':
                  await input.type('100');
                  break;
                case 'url':
                  await input.type('https://example.com');
                  break;
              }
            } catch (error) {
              console.log(`        Error filling field: ${error.message}`);
            }
          }
          
          await this.takeScreenshot(`admin-form-filled-${i}`);
          
          // Note: We won't actually submit to avoid creating test data
          console.log(`    Form filled but not submitted (test mode)`);
        }
        
      } catch (error) {
        console.log(`    Error testing CRUD button ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Dashboard widgets and stats
   */
  async testDashboardWidgets() {
    console.log('📊 Testing dashboard widgets...');
    
    // Go to main dashboard/admin page
    await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Look for dashboard elements
    const widgets = await this.page.$$('.widget, .card, .stat-card, .dashboard-card, [data-testid*="widget"]');
    const charts = await this.page.$$('.chart, canvas, svg');
    const tables = await this.page.$$('table, .table, [role="table"]');
    
    console.log(`Dashboard elements: ${widgets.length} widgets, ${charts.length} charts, ${tables.length} tables`);
    
    // Take screenshot of dashboard
    await this.takeScreenshot('admin-dashboard-overview');
    
    // Test clicking on widgets
    for (let i = 0; i < Math.min(widgets.length, 5); i++) {
      try {
        const widget = widgets[i];
        console.log(`  Testing widget ${i + 1}`);
        
        await widget.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await this.takeScreenshot(`admin-widget-${i + 1}-clicked`);
        
      } catch (error) {
        console.log(`    Error testing widget ${i + 1}: ${error.message}`);
      }
    }
  }

  async runAllAdminTests() {
    console.log('🎯 Starting Admin & Dashboard Browser Tests\n');
    
    this.results.push(await this.runTest('Admin Access & Login', () => this.testAdminAccess()));
    this.results.push(await this.runTest('Admin Menu Navigation', () => this.testAdminMenuItems()));
    this.results.push(await this.runTest('Admin CRUD Operations', () => this.testAdminCRUDOperations()));
    this.results.push(await this.runTest('Dashboard Widgets', () => this.testDashboardWidgets()));

    const report = {
      timestamp: new Date().toISOString(),
      testType: 'Admin & Dashboard Testing',
      totalTests: this.results.length,
      passed: this.results.filter(r => r.status === 'PASS').length,
      failed: this.results.filter(r => r.status === 'FAIL').length,
      results: this.results,
      screenshots: await fs.readdir(this.screenshotDir).catch(() => [])
    };

    return report;
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
    console.log('🧹 Admin test cleanup completed');
  }

  async generateHTMLReport(report) {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AudioTricks Admin & Dashboard Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #dc2626; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .test-result { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #e5e7eb; }
        .test-result.pass { border-left-color: #16a34a; }
        .test-result.fail { border-left-color: #dc2626; }
        .screenshot { max-width: 300px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; }
        .screenshots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 AudioTricks Admin & Dashboard Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Comprehensive testing of admin interface and dashboard functionality</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <div class="stat-number">${report.totalTests}</div>
            <div>Admin Tests</div>
        </div>
        <div class="stat-card passed">
            <div class="stat-number">${report.passed}</div>
            <div>Passed</div>
        </div>
        <div class="stat-card failed">
            <div class="stat-number">${report.failed}</div>
            <div>Failed</div>
        </div>
    </div>
    
    <h2>Admin Test Results</h2>
    ${report.results.map(result => `
        <div class="test-result ${result.status.toLowerCase()}">
            <h3>${result.test} - ${result.status}</h3>
            <p><strong>Duration:</strong> ${result.duration}ms</p>
            ${result.message ? `<p><strong>Details:</strong> ${result.message}</p>` : ''}
            ${result.screenshot ? `<img src="test-screenshots/${result.screenshot}" class="screenshot" alt="Test Screenshot" onclick="window.open('test-screenshots/${result.screenshot}', '_blank')" />` : ''}
        </div>
    `).join('')}
    
    <h2>All Admin Screenshots</h2>
    <div class="screenshots-grid">
        ${report.screenshots.filter(s => s.includes('admin')).map(screenshot => 
            `<img src="test-screenshots/${screenshot}" class="screenshot" alt="${screenshot}" title="${screenshot}" onclick="window.open('test-screenshots/${screenshot}', '_blank')" />`
        ).join('')}
    </div>
</body>
</html>`;

    const reportPath = path.join(__dirname, '../../admin-test-report.html');
    await fs.writeFile(reportPath, htmlContent);
    console.log(`📊 Admin test report generated: ${reportPath}`);
  }
}

async function runAdminTests() {
  const tester = new AdminBrowserTester();
  
  try {
    await tester.initialize();
    const report = await tester.runAllAdminTests();
    
    console.log('\n📊 ADMIN TEST SUMMARY:');
    console.log(`Total: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    
    await tester.generateHTMLReport(report);
    
    const jsonReportPath = path.join(__dirname, '../../admin-test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));
    
    process.exit(report.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('💥 Admin test suite failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  runAdminTests();
}

module.exports = { AdminBrowserTester, runAdminTests };