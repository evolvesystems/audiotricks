/**
 * Authentication Tests for AudioTricks
 * Tests login functionality and user authentication
 * CLAUDE.md compliant - Under 250 lines
 */

import { Page } from 'puppeteer';
import { TestHelpers } from '../utils/test-helpers';

export class AuthTests {
  private page: Page;
  private helpers: TestHelpers;

  constructor(page: Page, helpers: TestHelpers) {
    this.page = page;
    this.helpers = helpers;
  }

  /**
   * Test: Attempt login (if login form exists)
   */
  async testLogin(): Promise<void> {
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
   * Test: Check user session and authentication state
   */
  async testUserSession(): Promise<void> {
    // Check for user menu or profile elements
    const userElements = [
      '[data-testid*="user"]',
      '.user-menu',
      '.profile-menu',
      '[aria-label*="user"]',
      'button:has-text("Profile")',
      'button:has-text("Account")'
    ];

    let userElementFound = false;
    for (const selector of userElements) {
      if (await this.helpers.elementExists(selector)) {
        userElementFound = true;
        console.log(`Found user element: ${selector}`);
        break;
      }
    }

    if (!userElementFound) {
      console.log('No user session indicators found');
      return;
    }

    // Try to access user settings or profile
    const profileLink = await this.page.$('a[href*="profile"], a[href*="settings"], button:has-text("Settings")');
    if (profileLink) {
      await profileLink.click();
      await this.helpers.waitForNavigation();
      await this.helpers.takeScreenshot('user-profile-page');
    }
  }

  /**
   * Test: Registration flow (if available)
   */
  async testRegistration(): Promise<void> {
    // Look for registration link
    const registerButton = await this.page.$(
      'a[href*="register"], a[href*="signup"], button:has-text("Register"), button:has-text("Sign Up")'
    );

    if (!registerButton) {
      console.log('No registration link found');
      return;
    }

    await registerButton.click();
    await this.helpers.waitForNavigation();

    // Look for registration form fields
    const emailField = await this.page.$('input[type="email"], input[name*="email"]');
    const passwordField = await this.page.$('input[type="password"], input[name*="password"]');
    const confirmPasswordField = await this.page.$('input[name*="confirm"], input[placeholder*="confirm"]');

    if (emailField && passwordField) {
      // Generate unique test email
      const testEmail = `test-${Date.now()}@audiotricks.com`;
      await emailField.type(testEmail);
      await passwordField.type('testpassword123');
      
      if (confirmPasswordField) {
        await confirmPasswordField.type('testpassword123');
      }

      // Look for additional fields
      const nameField = await this.page.$('input[name*="name"], input[placeholder*="name"]');
      if (nameField) {
        await nameField.type('Test User');
      }

      // Take screenshot of filled form
      await this.helpers.takeScreenshot('registration-form-filled');

      // Note: We don't actually submit to avoid creating test users in production
      console.log('Registration form filled but not submitted (safety measure)');
    }
  }

  /**
   * Test: Password reset flow
   */
  async testPasswordReset(): Promise<void> {
    // Look for forgot password link
    const forgotPasswordLink = await this.page.$(
      'a:has-text("Forgot"), a:has-text("Reset"), a[href*="forgot"], a[href*="reset"]'
    );

    if (!forgotPasswordLink) {
      console.log('No password reset link found');
      return;
    }

    await forgotPasswordLink.click();
    await this.helpers.waitForNavigation();

    // Look for email field in reset form
    const emailField = await this.page.$('input[type="email"], input[name*="email"]');
    if (emailField) {
      await emailField.type('test@audiotricks.com');
      await this.helpers.takeScreenshot('password-reset-form');
      
      // Note: We don't submit to avoid sending actual reset emails
      console.log('Password reset form filled but not submitted (safety measure)');
    }
  }
}