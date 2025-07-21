#!/usr/bin/env node

/**
 * Simple script to test admin login functionality
 * 
 * Usage: node tests/e2e/runAdminLogin.js
 * 
 * Prerequisites:
 * 1. Make sure the app is running on http://localhost:3001
 * 2. Ensure you have a test user with email: test@example.com and password: TestPass123
 */

import puppeteer from 'puppeteer';

async function runTest() {
  const browser = await puppeteer.launch({
    headless: false, // Set to true to run without browser window
    slowMo: 50 // Slow down by 50ms to see actions
  });

  try {
    const page = await browser.newPage();
    
    console.log('1. Navigating to admin page...');
    await page.goto('http://localhost:3001/admin');
    
    console.log('2. Filling login form...');
    await page.type('input[type="email"]', 'test@example.com');
    await page.type('input[type="password"]', 'TestPass123');
    
    console.log('3. Clicking sign in...');
    await page.click('button[type="submit"]');
    
    console.log('4. Waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('5. Checking results...');
    const url = page.url();
    const pageContent = await page.$eval('body', el => el.innerText);
    
    console.log('\n✅ RESULTS:');
    console.log('Current URL:', url);
    console.log('Login successful:', url.includes('admin') && !url.includes('login'));
    console.log('Found dashboard:', pageContent.includes('Admin Dashboard'));
    console.log('Found user table:', pageContent.includes('USER') && pageContent.includes('ROLE'));
    
    await page.screenshot({ path: 'admin-dashboard.png' });
    console.log('\n📸 Screenshot saved as admin-dashboard.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

runTest();