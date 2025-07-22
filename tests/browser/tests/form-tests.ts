/**
 * Form Tests for AudioTricks
 * Tests all forms and input functionality
 * CLAUDE.md compliant - Under 250 lines
 */

import { Page } from 'puppeteer';
import { TestHelpers } from '../utils/test-helpers';

export class FormTests {
  private page: Page;
  private helpers: TestHelpers;

  constructor(page: Page, helpers: TestHelpers) {
    this.page = page;
    this.helpers = helpers;
  }

  /**
   * Test: Find and test all forms (add/edit functionality)
   */
  async testAllForms(): Promise<void> {
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
          
          await this.helpers.fillFormField(input, type, name);
        }
        
        // Take screenshot of filled form
        await this.helpers.takeScreenshot(`form-${i + 1}-filled`);
        
        // Try to submit the form (but only if it looks safe)
        const submitButton = await form.$('input[type="submit"], button[type="submit"], button:not([type])');
        if (submitButton) {
          const submitText = await submitButton.evaluate(el => el.textContent?.toLowerCase() || '');
          
          // Skip dangerous actions
          if (!this.helpers.isSafeToClick(submitText)) {
            console.log(`    Skipping potentially dangerous form submission: ${submitText}`);
            continue;
          }
          
          console.log(`    Submitting form with button: ${submitText}`);
          await submitButton.click();
          await this.page.waitForTimeout(3000);
          
          // Take screenshot after submission
          await this.helpers.takeScreenshot(`form-${i + 1}-submitted`);
        }
        
      } catch (error) {
        console.log(`  Error testing form ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Dynamic form interactions (show/hide fields, validation)
   */
  async testDynamicFormBehavior(): Promise<void> {
    // Test radio buttons and checkboxes for dynamic behavior
    const radioButtons = await this.page.$$('input[type="radio"]');
    const checkboxes = await this.page.$$('input[type="checkbox"]');
    
    console.log(`Testing ${radioButtons.length} radio buttons and ${checkboxes.length} checkboxes`);

    // Click each radio button and check for changes
    for (const radio of radioButtons) {
      try {
        const name = await radio.evaluate(el => el.getAttribute('name') || 'unnamed');
        const value = await radio.evaluate(el => el.getAttribute('value') || 'no-value');
        
        await radio.click();
        await this.page.waitForTimeout(500); // Wait for any dynamic changes
        
        console.log(`  Clicked radio: ${name} = ${value}`);
      } catch (error) {
        console.log(`  Error clicking radio button: ${error.message}`);
      }
    }

    // Toggle checkboxes
    for (const checkbox of checkboxes) {
      try {
        const name = await checkbox.evaluate(el => el.getAttribute('name') || 'unnamed');
        const isChecked = await checkbox.evaluate(el => (el as HTMLInputElement).checked);
        
        await checkbox.click();
        await this.page.waitForTimeout(500);
        
        console.log(`  Toggled checkbox: ${name} (was ${isChecked ? 'checked' : 'unchecked'})`);
      } catch (error) {
        console.log(`  Error toggling checkbox: ${error.message}`);
      }
    }
  }

  /**
   * Test: Form validation
   */
  async testFormValidation(): Promise<void> {
    const forms = await this.page.$$('form');
    
    for (let i = 0; i < Math.min(forms.length, 3); i++) { // Test first 3 forms
      const form = forms[i];
      
      try {
        // Try submitting empty form to trigger validation
        const submitButton = await form.$('button[type="submit"], input[type="submit"]');
        if (!submitButton) continue;
        
        const submitText = await submitButton.evaluate(el => el.textContent?.toLowerCase() || '');
        if (!this.helpers.isSafeToClick(submitText)) continue;
        
        console.log(`  Testing validation on form ${i + 1}`);
        await submitButton.click();
        await this.page.waitForTimeout(1000);
        
        // Look for validation messages
        const validationMessages = await this.page.$$('.error, .validation-error, [aria-invalid="true"], .invalid-feedback');
        if (validationMessages.length > 0) {
          console.log(`    Found ${validationMessages.length} validation messages`);
          await this.helpers.takeScreenshot(`form-${i + 1}-validation`);
        }
        
        // Test invalid email format
        const emailField = await form.$('input[type="email"]');
        if (emailField) {
          await emailField.click({ clickCount: 3 }); // Select all
          await emailField.type('invalid-email-format');
          await submitButton.click();
          await this.page.waitForTimeout(1000);
          await this.helpers.takeScreenshot(`form-${i + 1}-invalid-email`);
        }
        
      } catch (error) {
        console.log(`  Error testing form validation ${i + 1}: ${error.message}`);
      }
    }
  }

  /**
   * Test: Search functionality
   */
  async testSearchForms(): Promise<void> {
    // Look for search inputs
    const searchInputs = await this.page.$$(
      'input[type="search"], input[name*="search"], input[placeholder*="search"], input[aria-label*="search"]'
    );
    
    console.log(`Found ${searchInputs.length} search inputs`);
    
    for (let i = 0; i < searchInputs.length; i++) {
      try {
        const input = searchInputs[i];
        
        // Test search with various queries
        const testQueries = ['test', 'audio', '123', 'special@characters'];
        
        for (const query of testQueries) {
          await input.click({ clickCount: 3 }); // Select all
          await input.type(query);
          
          // Look for search button or trigger on enter
          const searchButton = await this.page.$('button[type="submit"], button:has-text("Search")');
          if (searchButton) {
            await searchButton.click();
          } else {
            await input.press('Enter');
          }
          
          await this.page.waitForTimeout(2000);
          console.log(`    Searched for: "${query}"`);
          
          // Check for results or no results message
          const hasResults = await this.page.$('.results, .search-results, [data-testid*="results"]') !== null;
          const noResults = await this.page.$('.no-results, :has-text("No results"), :has-text("not found")') !== null;
          
          if (hasResults || noResults) {
            await this.helpers.takeScreenshot(`search-${i + 1}-${query}`);
          }
        }
      } catch (error) {
        console.log(`  Error testing search input ${i + 1}: ${error.message}`);
      }
    }
  }
}