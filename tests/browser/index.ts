/**
 * Browser Test Suite Index
 * Exports all test modules for easy access
 * CLAUDE.md compliant - Under 250 lines
 */

// Export main runner
export { AudioTricksBrowserTester, runBrowserTests } from './browser-test-runner';

// Export test utilities
export { TestHelpers, TestResult, TestReport } from './utils/test-helpers';
export { TestReporter } from './utils/test-reporter';

// Export test modules
export { HomepageTests } from './tests/homepage-tests';
export { AuthTests } from './tests/auth-tests';
export { FormTests } from './tests/form-tests';
export { UploadTests } from './tests/upload-tests';