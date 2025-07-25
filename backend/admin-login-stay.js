import puppeteer from 'puppeteer';

async function loginAndStay() {
  console.log('🚀 Starting admin login - staying logged in...');
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Navigate to admin login page
    console.log('📍 Navigating to admin login page...');
    await page.goto('https://audiotricks.netlify.app/admin/login', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('📄 Login page loaded');

    // Find and fill login form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    
    if (!emailInput || !passwordInput) {
      console.log('❌ Login form not found');
      return;
    }

    console.log('📝 Filling login credentials...');
    await emailInput.type('admin@audiotricks.com');
    await passwordInput.type('admin123');
    
    // Submit the form
    console.log('🔐 Submitting login...');
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        passwordInput.press('Enter')
      ]);
    } catch (navError) {
      console.log('⚠️  Navigation timeout, checking current state...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Check if login was successful
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    if (currentUrl.includes('/admin') && !currentUrl.includes('/login')) {
      console.log('✅ LOGIN SUCCESSFUL!');
      
      // Get page title
      const title = await page.title();
      console.log('📄 Page title:', title);
      
      // Check for admin elements
      const adminElements = await page.evaluate(() => {
        const elements = [];
        
        // Check for admin user info
        const userInfo = document.querySelector('.admin, [class*="admin"], [data-testid*="admin"]');
        if (userInfo) elements.push(`User info: ${userInfo.textContent.trim()}`);
        
        // Check for navigation items
        const navItems = Array.from(document.querySelectorAll('nav a, [role="navigation"] a, .sidebar a, .menu a'))
          .map(a => a.textContent.trim())
          .filter(text => text.length > 0)
          .slice(0, 10);
        
        if (navItems.length > 0) elements.push(`Navigation: ${navItems.join(', ')}`);
        
        // Check for main content headings
        const headings = Array.from(document.querySelectorAll('h1, h2, h3'))
          .map(h => h.textContent.trim())
          .filter(text => text.length > 0)
          .slice(0, 5);
          
        if (headings.length > 0) elements.push(`Headings: ${headings.join(', ')}`);
        
        return elements;
      });
      
      console.log('🎯 Admin interface elements:');
      adminElements.forEach(element => console.log(`   ${element}`));
      
      // Take screenshot of admin dashboard
      await page.screenshot({ 
        path: 'admin-dashboard-logged-in.png', 
        fullPage: true 
      });
      console.log('📸 Screenshot saved: admin-dashboard-logged-in.png');
      
      // Navigate to different admin sections to show functionality
      console.log('\n🧭 Exploring admin sections...');
      
      const sectionsToTest = [
        { name: 'User Management', selector: 'a[href*="users"], a:contains("Users"), a:contains("User")' },
        { name: 'Dashboard', selector: 'a[href*="dashboard"], a:contains("Dashboard")' },
        { name: 'Settings', selector: 'a[href*="settings"], a:contains("Settings")' },
        { name: 'Analytics', selector: 'a[href*="analytics"], a:contains("Analytics")' }
      ];
      
      for (const section of sectionsToTest) {
        try {
          // Try different selector approaches
          let sectionLink = await page.$(`a[href*="${section.name.toLowerCase()}"]`);
          if (!sectionLink) {
            sectionLink = await page.$(`a:contains("${section.name}")`);
          }
          if (!sectionLink) {
            // Find by text content
            sectionLink = await page.evaluateHandle((sectionName) => {
              const links = Array.from(document.querySelectorAll('a'));
              return links.find(link => 
                link.textContent.toLowerCase().includes(sectionName.toLowerCase())
              );
            }, section.name);
          }
          
          if (sectionLink && sectionLink.asElement()) {
            console.log(`🔗 Clicking on ${section.name}...`);
            await sectionLink.click();
            await page.waitForTimeout(2000);
            
            const newUrl = page.url();
            console.log(`   📍 ${section.name} URL: ${newUrl}`);
            
            await page.screenshot({ 
              path: `admin-${section.name.toLowerCase().replace(' ', '-')}.png`,
              fullPage: true 
            });
            console.log(`   📸 Screenshot: admin-${section.name.toLowerCase().replace(' ', '-')}.png`);
          } else {
            console.log(`   ⚠️  ${section.name} link not found`);
          }
        } catch (error) {
          console.log(`   ❌ Error accessing ${section.name}: ${error.message}`);
        }
      }
      
      console.log('\n🎉 Admin tour complete! Browser will stay open...');
      console.log('💡 You can now interact with the admin interface manually.');
      console.log('🔒 Session is maintained - you are logged in as admin@audiotricks.com');
      console.log('\n⌨️  Press Ctrl+C to close browser when done...');
      
      // Keep browser open indefinitely
      await new Promise(() => {}); // Never resolves
      
    } else {
      console.log('❌ LOGIN FAILED - still on login page or redirected elsewhere');
      
      // Check for error messages
      const errorElements = await page.$$eval('*', elements => 
        elements
          .map(el => el.textContent?.trim())
          .filter(text => text && (
            text.toLowerCase().includes('error') ||
            text.toLowerCase().includes('invalid') ||
            text.toLowerCase().includes('failed')
          ))
          .slice(0, 3)
      );
      
      if (errorElements.length > 0) {
        console.log('🚨 Error messages found:', errorElements);
      }
    }

  } catch (error) {
    console.error('💥 Error during login test:', error.message);
    try {
      await page.screenshot({ path: 'admin-login-error.png', fullPage: true });
      console.log('📸 Error screenshot saved');
    } catch (screenshotError) {
      console.log('Could not take error screenshot');
    }
  }
  
  // Note: Browser intentionally NOT closed to stay logged in
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Closing browser...');
  process.exit(0);
});

// Run the test
loginAndStay().catch(console.error);