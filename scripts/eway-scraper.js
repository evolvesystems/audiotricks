import puppeteer from 'puppeteer';
import fs from 'fs';

// eWAY API documentation sections to scrape
const ewayDocSections = [
    'connection-methods',
    'direct-connection', 
    'transparent-redirect',
    'responsive-shared-page',
    'iframe',
    'secure-fields',
    'secure-panel',
    'pay-now-button',
    'tokens',
    'creating-a-token-customer',
    'updating-a-token-customer',
    'token-payments',
    'recurring-payments',
    'refunds',
    'response-codes',
    'error-codes',
    'fraud-prevention',
    '3d-secure',
    'webhooks',
    'testing-guide',
    'go-live-checklist',
    'api-reference',
    'sdks',
    'field-reference',
    'country-codes',
    'currency-codes'
];

class EwayDocumentationScraper {
    constructor() {
        this.baseUrl = 'https://www.eway.com.au/api-v3/';
        this.results = {};
        this.browser = null;
        this.page = null;
    }

    async initialize() {
        console.log('🚀 Initializing Puppeteer browser...');
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Set viewport
        await this.page.setViewport({ width: 1280, height: 800 });
        
        console.log('✅ Browser initialized successfully');
    }

    async scrapeSection(sectionId) {
        const url = this.baseUrl + '#' + sectionId;
        console.log(`📖 Scraping section: ${sectionId}`);
        console.log(`🔗 URL: ${url}`);

        try {
            // Navigate to the URL
            await this.page.goto(url, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            // Wait a bit for any dynamic content to load
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Try to find the specific section content
            const sectionData = await this.page.evaluate((sectionId) => {
                // Try multiple selectors to find the section content
                const selectors = [
                    `#${sectionId}`,
                    `[id="${sectionId}"]`,
                    `h1:has-text("${sectionId}")`,
                    `h2:has-text("${sectionId}")`,
                    `h3:has-text("${sectionId}")`,
                    `.section-${sectionId}`,
                    `[data-section="${sectionId}"]`
                ];

                let sectionElement = null;
                
                // Try to find the section by ID or other attributes
                for (const selector of [`#${sectionId}`, `[id="${sectionId}"]`]) {
                    sectionElement = document.querySelector(selector);
                    if (sectionElement) break;
                }

                // If not found by ID, try to find by heading text
                if (!sectionElement) {
                    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
                    for (const heading of headings) {
                        const text = heading.textContent.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        if (text.includes(sectionId.replace(/-/g, '')) || 
                            heading.textContent.toLowerCase().includes(sectionId.replace(/-/g, ' '))) {
                            sectionElement = heading;
                            break;
                        }
                    }
                }

                if (!sectionElement) {
                    return {
                        title: sectionId,
                        content: 'Section not found',
                        fullPageContent: document.body.innerText.substring(0, 1000) + '...'
                    };
                }

                // Get the section content
                let content = '';
                let title = sectionId;

                // Try to get the title from the heading
                if (sectionElement.tagName && sectionElement.tagName.match(/^H[1-6]$/)) {
                    title = sectionElement.textContent.trim();
                    
                    // Get content following the heading
                    let currentElement = sectionElement.nextElementSibling;
                    while (currentElement && !currentElement.tagName.match(/^H[1-6]$/)) {
                        if (currentElement.textContent.trim()) {
                            content += currentElement.textContent.trim() + '\\n\\n';
                        }
                        currentElement = currentElement.nextElementSibling;
                    }
                } else {
                    // Get the section element content directly
                    title = sectionElement.id || sectionElement.className || sectionId;
                    content = sectionElement.textContent.trim();
                }

                // If still no content, get a broader area
                if (!content || content.length < 100) {
                    // Try to get the parent container content
                    const parent = sectionElement.closest('section, article, div[class*="content"], div[class*="section"]');
                    if (parent) {
                        content = parent.textContent.trim();
                    }
                }

                // Extract any code examples
                const codeBlocks = [];
                const codeElements = document.querySelectorAll('pre, code, .code-block, .highlight');
                codeElements.forEach((code, index) => {
                    if (code.textContent.length > 20) {
                        codeBlocks.push({
                            index: index,
                            language: code.className || 'text',
                            content: code.textContent.trim()
                        });
                    }
                });

                return {
                    title: title,
                    content: content || 'No content extracted',
                    codeExamples: codeBlocks,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                };

            }, sectionId);

            console.log(`✅ Successfully scraped: ${sectionId} (${sectionData.content.length} chars)`);
            return sectionData;

        } catch (error) {
            console.error(`❌ Error scraping section ${sectionId}:`, error.message);
            return {
                title: sectionId,
                content: `Error scraping section: ${error.message}`,
                error: true,
                timestamp: new Date().toISOString()
            };
        }
    }

    async scrapeAllSections() {
        console.log('📚 Starting comprehensive eWAY documentation scraping...');
        console.log(`📋 Sections to scrape: ${ewayDocSections.length}`);

        for (const section of ewayDocSections) {
            this.results[section] = await this.scrapeSection(section);
            
            // Add delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('🎉 Scraping completed!');
    }

    async scrapeMainPage() {
        console.log('📖 Scraping main API documentation page...');
        
        try {
            await this.page.goto(this.baseUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            await new Promise(resolve => setTimeout(resolve, 3000));

            const mainPageData = await this.page.evaluate(() => {
                // Extract navigation/table of contents
                const nav = document.querySelector('nav, .navigation, .toc, .sidebar');
                const navContent = nav ? nav.textContent : '';

                // Extract main content
                const main = document.querySelector('main, .main-content, .content, .documentation');
                const mainContent = main ? main.textContent : document.body.textContent;

                // Extract all headings to understand structure
                const headings = [];
                document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                    headings.push({
                        level: heading.tagName,
                        text: heading.textContent.trim(),
                        id: heading.id || ''
                    });
                });

                // Extract links to different sections
                const sectionLinks = [];
                document.querySelectorAll('a[href*="#"]').forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.includes('#')) {
                        sectionLinks.push({
                            text: link.textContent.trim(),
                            href: href,
                            section: href.split('#')[1]
                        });
                    }
                });

                return {
                    title: document.title,
                    navigation: navContent.substring(0, 2000),
                    content: mainContent.substring(0, 5000),
                    headings: headings,
                    sectionLinks: sectionLinks,
                    url: window.location.href
                };
            });

            this.results['main-page'] = mainPageData;
            console.log('✅ Main page scraped successfully');

        } catch (error) {
            console.error('❌ Error scraping main page:', error);
            this.results['main-page'] = { error: error.message };
        }
    }

    async saveResults() {
        const outputFile = '/Users/johnnorth/CascadeProjects/AudioTricks/database/eway-documentation-complete.json';
        
        console.log('💾 Saving results to:', outputFile);
        
        const output = {
            metadata: {
                scrapedAt: new Date().toISOString(),
                totalSections: Object.keys(this.results).length,
                baseUrl: this.baseUrl,
                scraper: 'AudioTricks eWAY Documentation Scraper v1.0'
            },
            sections: this.results
        };

        fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
        console.log('✅ Results saved successfully');

        // Also create a markdown summary
        await this.createMarkdownSummary();
    }

    async createMarkdownSummary() {
        const summaryFile = '/Users/johnnorth/CascadeProjects/AudioTricks/database/eway-documentation-summary.md';
        
        let markdown = '# eWAY API Documentation - Complete Extraction\\n\\n';
        markdown += `Scraped on: ${new Date().toISOString()}\\n\\n`;
        markdown += `Total sections: ${Object.keys(this.results).length}\\n\\n`;
        markdown += '---\\n\\n';

        for (const [sectionId, data] of Object.entries(this.results)) {
            markdown += `## ${data.title || sectionId}\\n\\n`;
            
            if (data.error) {
                markdown += `❌ **Error**: ${data.content}\\n\\n`;
            } else {
                // Add content (truncated if too long)
                const content = data.content || 'No content';
                markdown += content.length > 1000 
                    ? content.substring(0, 1000) + '...\\n\\n'
                    : content + '\\n\\n';

                // Add code examples if any
                if (data.codeExamples && data.codeExamples.length > 0) {
                    markdown += '### Code Examples:\\n\\n';
                    data.codeExamples.forEach((code, index) => {
                        markdown += `\`\`\`${code.language}\\n${code.content}\\n\`\`\`\\n\\n`;
                    });
                }
            }
            
            markdown += '---\\n\\n';
        }

        fs.writeFileSync(summaryFile, markdown);
        console.log('✅ Markdown summary created');
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 Browser closed');
        }
    }

    async run() {
        try {
            await this.initialize();
            await this.scrapeMainPage();
            await this.scrapeAllSections();
            await this.saveResults();
        } catch (error) {
            console.error('💥 Fatal error:', error);
        } finally {
            await this.cleanup();
        }
    }
}

// Run the scraper
const scraper = new EwayDocumentationScraper();
scraper.run().then(() => {
    console.log('🎊 eWAY documentation scraping completed successfully!');
    process.exit(0);
}).catch(error => {
    console.error('💥 Scraper failed:', error);
    process.exit(1);
});