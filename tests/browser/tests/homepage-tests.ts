/**
 * Homepage Tests for AudioTricks
 * Tests homepage loading and button interactions
 * CLAUDE.md compliant - Under 250 lines
 */

import { Page } from 'puppeteer';
import { TestHelpers } from '../utils/test-helpers';

export class HomepageTests {
  private page: Page;
  private helpers: TestHelpers;
  private baseUrl: string;

  constructor(page: Page, helpers: TestHelpers, baseUrl: string) {
    this.page = page;
    this.helpers = helpers;
    this.baseUrl = baseUrl;
  }

  /**
   * Test: Navigate to homepage and check basic elements
   */
  async testHomepageLoad(): Promise<void> {
    await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Check if the page loaded properly
    await this.helpers.waitForElement('body');
    
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
    // Find all clickable elements
    const buttons = await this.page.$$('button, a[href], [role="button"], input[type="button"], input[type="submit"]');
    console.log(`Found ${buttons.length} clickable elements on homepage`);

    for (let i = 0; i < buttons.length; i++) {
      try {
        const button = buttons[i];
        const tagName = await button.evaluate(el => el.tagName.toLowerCase());
        const text = await button.evaluate(el => el.textContent?.trim() || 'No text');
        
        console.log(`  Clicking button ${i + 1}/${buttons.length}: ${tagName} - "${text}"`);
        
        // Skip potentially destructive buttons
        if (!this.helpers.isSafeToClick(text)) {
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
   * Test: Navigate through all menu items
   */
  async testAllMenuItems(): Promise<void> {
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
          await this.helpers.takeScreenshot(`menu-${text.replace(/[^a-zA-Z0-9]/g, '-')}`);
          
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
}