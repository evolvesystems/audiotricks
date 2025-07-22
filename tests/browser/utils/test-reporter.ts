/**
 * Test Reporter for Browser Testing
 * Handles report generation and output
 * CLAUDE.md compliant - Under 250 lines
 */

import { promises as fs } from 'fs';
import path from 'path';
import { TestReport, TestResult } from './test-helpers';

export class TestReporter {
  private screenshotDir: string;

  constructor(screenshotDir: string) {
    this.screenshotDir = screenshotDir;
  }

  /**
   * Generate console summary
   */
  printSummary(report: TestReport): void {
    console.log('\n📊 TEST SUMMARY:');
    console.log(`Total: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏭️ Skipped: ${report.skipped}`);
  }

  /**
   * Save JSON report
   */
  async saveJSONReport(report: TestReport): Promise<void> {
    const jsonReportPath = path.join(this.screenshotDir, '../test-results.json');
    await fs.writeFile(jsonReportPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonReportPath}`);
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(report: TestReport): Promise<void> {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>AudioTricks Browser Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; }
        .passed { color: #16a34a; }
        .failed { color: #dc2626; }
        .skipped { color: #ea580c; }
        .test-result { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid #e5e7eb; }
        .test-result.pass { border-left-color: #16a34a; }
        .test-result.fail { border-left-color: #dc2626; }
        .test-result.skip { border-left-color: #ea580c; }
        .screenshot { max-width: 200px; margin: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .test-details { display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center; }
        .error-message { color: #dc2626; font-style: italic; margin-top: 5px; }
        .duration { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 AudioTricks Browser Test Report</h1>
        <p>Generated: ${report.timestamp}</p>
        <p>Comprehensive browser testing with Puppeteer</p>
    </div>
    
    <div class="summary">
        <div class="stat-card">
            <div class="stat-number">${report.totalTests}</div>
            <div>Total Tests</div>
        </div>
        <div class="stat-card passed">
            <div class="stat-number">${report.passed}</div>
            <div>Passed</div>
        </div>
        <div class="stat-card failed">
            <div class="stat-number">${report.failed}</div>
            <div>Failed</div>
        </div>
        <div class="stat-card skipped">
            <div class="stat-number">${report.skipped}</div>
            <div>Skipped</div>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${report.results.map(result => this.renderTestResult(result)).join('')}
    
    <h2>All Screenshots</h2>
    <div style="display: flex; flex-wrap: wrap;">
        ${report.screenshots.map(screenshot => 
            `<img src="test-screenshots/${screenshot}" class="screenshot" alt="${screenshot}" title="${screenshot}" />`
        ).join('')}
    </div>
</body>
</html>`;

    const reportPath = path.join(this.screenshotDir, '../browser-test-report.html');
    await fs.writeFile(reportPath, htmlContent);
    console.log(`📊 HTML report generated: ${reportPath}`);
  }

  /**
   * Render individual test result HTML
   */
  private renderTestResult(result: TestResult): string {
    return `
        <div class="test-result ${result.status.toLowerCase()}">
            <div class="test-details">
                <div>
                    <h3>${result.test}</h3>
                    <p><strong>Status:</strong> ${result.status}</p>
                    <p class="duration"><strong>Duration:</strong> ${result.duration}ms</p>
                    ${result.message ? `<p class="error-message"><strong>Error:</strong> ${result.message}</p>` : ''}
                </div>
                ${result.screenshot ? `<img src="test-screenshots/${result.screenshot}" class="screenshot" alt="Screenshot" />` : ''}
            </div>
        </div>
    `;
  }

  /**
   * Create test report object
   */
  async createReport(results: TestResult[]): Promise<TestReport> {
    const screenshots = await fs.readdir(this.screenshotDir);
    
    return {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passed: results.filter(r => r.status === 'PASS').length,
      failed: results.filter(r => r.status === 'FAIL').length,
      skipped: results.filter(r => r.status === 'SKIP').length,
      results,
      screenshots
    };
  }
}