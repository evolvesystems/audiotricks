import puppeteer from 'puppeteer';

async function debugLoginPage() {
  console.log('🔍 Debugging login page...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('Loading admin login page...');
    await page.goto('http://localhost:3000/admin/login', { waitUntil: 'networkidle0' });
    
    // Take screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    console.log('Screenshot saved as login-page.png');
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        className: input.className
      }));
    });
    
    console.log('\nInput fields found:');
    inputs.forEach((input, i) => {
      console.log(`  ${i + 1}. Type: ${input.type}, Name: ${input.name}, ID: ${input.id}, Placeholder: ${input.placeholder}`);
    });
    
    // Get all buttons
    const buttons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.map(button => ({
        type: button.type,
        text: button.textContent.trim(),
        className: button.className
      }));
    });
    
    console.log('\nButtons found:');
    buttons.forEach((button, i) => {
      console.log(`  ${i + 1}. Type: ${button.type}, Text: "${button.text}"`);
    });
    
    // Get page HTML structure
    const structure = await page.evaluate(() => {
      const body = document.body;
      if (!body) return 'No body found';
      
      // Get a simplified structure
      const getStructure = (element, depth = 0) => {
        if (depth > 3) return '';
        const indent = '  '.repeat(depth);
        let result = indent + element.tagName.toLowerCase();
        if (element.id) result += `#${element.id}`;
        if (element.className) result += `.${element.className.split(' ').join('.')}`;
        result += '\n';
        
        for (const child of element.children) {
          if (['SCRIPT', 'STYLE'].includes(child.tagName)) continue;
          result += getStructure(child, depth + 1);
        }
        return result;
      };
      
      return getStructure(body);
    });
    
    console.log('\nPage structure:');
    console.log(structure.substring(0, 1000) + '...');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugLoginPage().catch(console.error);