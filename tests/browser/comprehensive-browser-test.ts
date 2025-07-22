/**
 * Comprehensive Browser Test Suite for AudioTricks
 * Entry point that delegates to the modular test runner
 * CLAUDE.md compliant - Refactored to comply with 250-line limit
 */

import { runBrowserTests } from './browser-test-runner';

// This file now serves as a simple entry point to the modular test suite
// All test logic has been refactored into separate modules:
// - browser-test-runner.ts: Main test orchestrator
// - utils/test-helpers.ts: Common test utilities
// - utils/test-reporter.ts: Report generation
// - tests/homepage-tests.ts: Homepage and navigation tests
// - tests/auth-tests.ts: Authentication tests
// - tests/form-tests.ts: Form interaction tests
// - tests/upload-tests.ts: File upload tests

// Run the browser tests
runBrowserTests();