/**
 * Main Browser Test Runner for AudioTricks
 * Orchestrates all browser tests
 * CLAUDE.md compliant - Under 250 lines
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';
import { TestHelpers, TestResult } from './utils/test-helpers';
import { TestReporter } from './utils/test-reporter';
import { HomepageTests } from './tests/homepage-tests';
import { AuthTests } from './tests/auth-tests';
import { FormTests } from './tests/form-tests';
import { UploadTests } from './tests/upload-tests';

export class AudioTricksBrowserTester {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private baseUrl: string;
  private results: TestResult[] = [];
  private screenshotDir: string;
  private helpers: TestHelpers | null = null;
  private reporter: TestReporter;

  constructor() {
    this.baseUrl = process.env.TEST_URL || 'http://localhost:3000';
    this.screenshotDir = path.join(__dirname, '../../test-screenshots');
    this.reporter = new TestReporter(this.screenshotDir);
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

    // Initialize helpers
    this.helpers = new TestHelpers(this.page, this.screenshotDir);

    console.log(`✅ Browser initialized, testing against: ${this.baseUrl}`);
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    if (!this.page || !this.helpers) {
      throw new Error('Browser not initialized');
    }

    console.log('🎯 Starting Comprehensive Browser Test Suite for AudioTricks\n');

    // Initialize test suites
    const homepageTests = new HomepageTests(this.page, this.helpers, this.baseUrl);
    const authTests = new AuthTests(this.page, this.helpers);
    const formTests = new FormTests(this.page, this.helpers);
    const uploadTests = new UploadTests(this.page, this.helpers);

    // Run homepage tests
    this.results.push(
      await this.helpers.runTest('Homepage Load', () => homepageTests.testHomepageLoad())
    );
    this.results.push(
      await this.helpers.runTest('Homepage Buttons', () => homepageTests.testHomepageButtons())
    );
    this.results.push(
      await this.helpers.runTest('Menu Navigation', () => homepageTests.testAllMenuItems())
    );

    // Run auth tests
    this.results.push(
      await this.helpers.runTest('Login Functionality', () => authTests.testLogin())
    );
    this.results.push(
      await this.helpers.runTest('User Session', () => authTests.testUserSession())
    );
    this.results.push(
      await this.helpers.runTest('Registration Flow', () => authTests.testRegistration())
    );
    this.results.push(
      await this.helpers.runTest('Password Reset', () => authTests.testPasswordReset())
    );

    // Run form tests
    this.results.push(
      await this.helpers.runTest('All Forms', () => formTests.testAllForms())
    );
    this.results.push(
      await this.helpers.runTest('Dynamic Form Behavior', () => formTests.testDynamicFormBehavior())
    );
    this.results.push(
      await this.helpers.runTest('Form Validation', () => formTests.testFormValidation())
    );
    this.results.push(
      await this.helpers.runTest('Search Functionality', () => formTests.testSearchForms())
    );

    // Run upload tests
    this.results.push(
      await this.helpers.runTest('File Upload', () => uploadTests.testUploadFunctionality())
    );
    this.results.push(
      await this.helpers.runTest('Drag and Drop', () => uploadTests.testDragAndDropUpload())
    );
    this.results.push(
      await this.helpers.runTest('Multiple Files', () => uploadTests.testMultipleFileUpload())
    );
    this.results.push(
      await this.helpers.runTest('File Type Validation', () => uploadTests.testFileTypeValidation())
    );
  }

  /**
   * Generate reports and cleanup
   */
  async finalize(): Promise<number> {
    // Generate report
    const report = await this.reporter.createReport(this.results);
    
    // Print summary
    this.reporter.printSummary(report);
    
    // Generate reports
    await this.reporter.generateHTMLReport(report);
    await this.reporter.saveJSONReport(report);
    
    // Cleanup
    await this.cleanup();
    
    // Return exit code
    return report.failed > 0 ? 1 : 0;
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
}

/**
 * Main test runner function
 */
async function runBrowserTests() {
  const tester = new AudioTricksBrowserTester();
  
  try {
    await tester.initialize();
    await tester.runAllTests();
    const exitCode = await tester.finalize();
    process.exit(exitCode);
  } catch (error) {
    console.error('💥 Browser test suite failed:', error);
    await tester.cleanup();
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runBrowserTests();
}

export { runBrowserTests };