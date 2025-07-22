/**
 * Test Helpers for Browser Testing
 * Common utilities and helper functions
 * CLAUDE.md compliant - Under 250 lines
 */

import { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

export interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message?: string;
  screenshot?: string;
  duration: number;
}

export interface TestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  results: TestResult[];
  screenshots: string[];
}

export class TestHelpers {
  private page: Page;
  private screenshotDir: string;

  constructor(page: Page, screenshotDir: string) {
    this.page = page;
    this.screenshotDir = screenshotDir;
  }

  /**
   * Take screenshot for debugging
   */
  async takeScreenshot(name: string): Promise<string> {
    const filename = `${Date.now()}-${name.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page.screenshot({ path: filepath, fullPage: true });
    return filename;
  }

  /**
   * Wait for element with timeout
   */
  async waitForElement(selector: string, timeout: number = 5000): Promise<void> {
    await this.page.waitForSelector(selector, { 
      timeout,
      visible: true 
    });
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
   * Check if element exists on page
   */
  async elementExists(selector: string): Promise<boolean> {
    return await this.page.$(selector) !== null;
  }

  /**
   * Get element text content
   */
  async getElementText(selector: string): Promise<string> {
    const element = await this.page.$(selector);
    if (!element) return '';
    return await element.evaluate(el => el.textContent?.trim() || '');
  }

  /**
   * Click element safely with error handling
   */
  async clickElement(selector: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    await element.click();
  }

  /**
   * Type into input field
   */
  async typeIntoField(selector: string, text: string): Promise<void> {
    const element = await this.page.$(selector);
    if (!element) {
      throw new Error(`Input field not found: ${selector}`);
    }
    await element.type(text);
  }

  /**
   * Wait for navigation or timeout
   */
  async waitForNavigation(timeout: number = 5000): Promise<void> {
    try {
      await this.page.waitForNavigation({ timeout, waitUntil: 'networkidle2' });
    } catch (error) {
      // Navigation might not happen, which is okay
    }
  }

  /**
   * Create test file for upload testing
   */
  async createTestFile(filename: string, content: string): Promise<string> {
    const testFilePath = path.join(path.dirname(this.screenshotDir), filename);
    await fs.writeFile(testFilePath, content);
    return testFilePath;
  }

  /**
   * Clean up test file
   */
  async cleanupTestFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Check if button is safe to click
   */
  isSafeToClick(buttonText: string): boolean {
    const dangerousKeywords = ['logout', 'delete', 'remove', 'cancel', 'destroy'];
    const lowerText = buttonText.toLowerCase();
    return !dangerousKeywords.some(keyword => lowerText.includes(keyword));
  }

  /**
   * Fill form field based on type
   */
  async fillFormField(input: any, type: string, name: string): Promise<void> {
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
}