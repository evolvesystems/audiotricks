import puppeteer from 'puppeteer';

async function testSuperAdmin() {
  console.log('🎵 Starting AudioTricks Super Admin Test with Puppeteer...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log') {
        console.log('Browser:', msg.text());
      }
    });
    
    // Test 1: Load admin login page
    console.log('📍 Test 1: Loading admin login page...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    console.log('✅ Admin login page loaded\n');
    
    // Test 2: Login as admin
    console.log('📍 Test 2: Logging in as admin@audiotricks.com...');
    
    // Wait for login form inputs
    await page.waitForSelector('input#email-address', { timeout: 5000 });
    
    // Fill login form using the correct selectors
    await page.type('input#email-address', 'admin@audiotricks.com');
    await page.type('input#password', 'admin123');
    
    // Submit login - click the Sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or login response
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
      console.log('No navigation after login, checking current state...');
    });
    
    console.log('Current URL:', page.url());
    
    // Check if we're logged in by looking for auth token
    const authToken = await page.evaluate(() => localStorage.getItem('authToken'));
    if (authToken) {
      console.log('✅ Login successful - auth token present');
      
      // Decode token to check role
      const tokenPayload = await page.evaluate((token) => {
        try {
          return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
          return null;
        }
      }, authToken);
      
      console.log('📋 Token payload:', tokenPayload);
      console.log(`   Role in token: ${tokenPayload?.role}\n`);
    } else {
      console.log('❌ Login failed - no auth token\n');
    }
    
    // Test 3: Navigate to admin test page
    console.log('📍 Test 3: Navigating to admin test page...');
    await page.goto('http://localhost:3000/admin/test', { waitUntil: 'networkidle0' });
    
    // Check if we can see user info
    const userInfo = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p'));
      const info = {};
      elements.forEach(el => {
        const text = el.textContent;
        if (text.includes('Email:')) info.email = text.split(':')[1]?.trim();
        if (text.includes('Role:')) info.role = text.split(':')[1]?.trim();
        if (text.includes('Is Admin:')) info.isAdmin = text.split(':')[1]?.trim();
        if (text.includes('Is Super Admin:')) info.isSuperAdmin = text.split(':')[1]?.trim();
      });
      return info;
    });
    
    console.log('📋 User Info from test page:');
    console.log(`   Email: ${userInfo.email || 'Not found'}`);
    console.log(`   Role: ${userInfo.role || 'Not found'}`);
    console.log(`   Is Admin: ${userInfo.isAdmin || 'Not found'}`);
    console.log(`   Is Super Admin: ${userInfo.isSuperAdmin || 'Not found'}\n`);
    
    // Test 4: Check admin dashboard menu
    console.log('📍 Test 4: Checking admin dashboard menu...');
    await page.goto('http://localhost:3000/admin/users', { waitUntil: 'networkidle0' });
    
    // Look for menu items
    const menuItems = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('a[href^="/admin"]'));
      return items.map(item => ({
        text: item.textContent.trim(),
        href: item.getAttribute('href')
      }));
    });
    
    console.log('📋 Menu items found:');
    menuItems.forEach(item => {
      console.log(`   - ${item.text} (${item.href})`);
    });
    
    // Check specifically for Super Admin menu
    const hasSuperAdminMenu = menuItems.some(item => 
      item.text.toLowerCase().includes('super admin') || 
      item.href === '/admin/super-settings'
    );
    
    console.log(`\n   Super Admin menu: ${hasSuperAdminMenu ? '✅ FOUND' : '❌ NOT FOUND'}\n`);
    
    // Test 5: Try to access super admin settings
    console.log('📍 Test 5: Accessing super admin settings page...');
    const response = await page.goto('http://localhost:3000/admin/super-settings', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    }).catch(e => null);
    
    if (page.url().includes('/admin/super-settings')) {
      console.log('✅ Super admin settings page accessible');
      
      // Check page title
      const pageTitle = await page.evaluate(() => {
        const h1 = document.querySelector('h1');
        return h1 ? h1.textContent : 'No title found';
      });
      console.log(`   Page title: ${pageTitle}\n`);
    } else {
      console.log(`❌ Redirected to: ${page.url()}\n`);
    }
    
    // Test 6: Check user role display
    console.log('📍 Test 6: Checking user role display...');
    const roleDisplay = await page.evaluate(() => {
      // Look for role display in header
      const roleElements = Array.from(document.querySelectorAll('span'));
      const roleElement = roleElements.find(el => 
        el.textContent.includes('Administrator') || 
        el.textContent.includes('Super Administrator') ||
        el.textContent.includes('User')
      );
      return roleElement ? roleElement.textContent.trim() : null;
    });
    
    console.log(`   Role display: ${roleDisplay || 'Not found'}`);
    console.log(`   Expected: "Super Administrator"\n`);
    
    // Test 7: Test admin API access
    console.log('📍 Test 7: Testing admin API access...');
    const apiResponse = await page.evaluate(async () => {
      const token = localStorage.getItem('authToken');
      if (!token) return { error: 'No token' };
      
      try {
        const response = await fetch('/api/admin/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        return {
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('📋 Admin API Response:');
    console.log(`   Status: ${apiResponse.status}`);
    console.log(`   Success: ${apiResponse.ok ? '✅ YES' : '❌ NO'}`);
    if (apiResponse.error) {
      console.log(`   Error: ${apiResponse.error}`);
    }
    
    // Get final token info for summary
    const finalToken = await page.evaluate(() => localStorage.getItem('authToken'));
    let finalTokenPayload = null;
    if (finalToken) {
      finalTokenPayload = await page.evaluate((token) => {
        try {
          return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
          return null;
        }
      }, finalToken);
    }
    
    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SUPER ADMIN TEST SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Login: ${finalToken ? '✅ Success' : '❌ Failed'}`);
    console.log(`Role in token: ${finalTokenPayload?.role === 'super_admin' ? '✅' : '❌'} ${finalTokenPayload?.role || 'Unknown'}`);
    console.log(`Is Super Admin: ${userInfo.isSuperAdmin === 'YES' ? '✅ YES' : '❌ NO'}`);
    console.log(`Super Admin menu: ${hasSuperAdminMenu ? '✅ Visible' : '❌ Not visible'}`);
    console.log(`Super Admin page: ${page.url().includes('/admin/super-settings') ? '✅ Accessible' : '❌ Not accessible'}`);
    console.log(`Role display: ${roleDisplay === 'Super Administrator' ? '✅' : '❌'} "${roleDisplay || 'Not found'}"`);
    console.log(`Admin API access: ${apiResponse.ok ? '✅ Allowed' : '❌ Blocked'}`);
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

// Run the test
testSuperAdmin().catch(console.error);