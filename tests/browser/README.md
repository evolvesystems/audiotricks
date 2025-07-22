# AudioTricks Browser Test Suite

## Overview

This directory contains the comprehensive browser test suite for AudioTricks, refactored to comply with CLAUDE.md's 250-line file limit. The test suite uses Puppeteer to perform real browser testing of all application features.

## Structure

```
browser/
├── index.ts                    # Module exports
├── comprehensive-browser-test.ts # Entry point (delegates to runner)
├── browser-test-runner.ts      # Main test orchestrator (< 250 lines)
├── utils/                      # Shared utilities
│   ├── test-helpers.ts        # Common test functions (< 250 lines)
│   └── test-reporter.ts       # Report generation (< 250 lines)
└── tests/                     # Feature-specific tests
    ├── homepage-tests.ts      # Homepage & navigation (< 250 lines)
    ├── auth-tests.ts          # Authentication tests (< 250 lines)
    ├── form-tests.ts          # Form interaction tests (< 250 lines)
    └── upload-tests.ts        # File upload tests (< 250 lines)
```

## Running Tests

```bash
# Run the comprehensive test suite
npm run test:browser

# Or run directly
npx ts-node tests/browser/comprehensive-browser-test.ts
```

## Test Coverage

The test suite covers:

### Homepage Tests
- Page load verification
- Button click testing
- Menu navigation
- Content verification

### Authentication Tests
- Login functionality
- User session verification
- Registration flow (without submission)
- Password reset flow (without submission)

### Form Tests
- All form detection and testing
- Dynamic form behavior
- Form validation
- Search functionality

### Upload Tests
- File upload functionality
- Drag and drop zones
- Multiple file uploads
- File type validation

## Test Reports

After running, the suite generates:
- **HTML Report**: `browser-test-report.html` with screenshots
- **JSON Report**: `test-results.json` with detailed results
- **Screenshots**: Saved in `test-screenshots/` directory

## Adding New Tests

1. Create a new test module in `tests/` directory
2. Keep it under 250 lines (CLAUDE.md compliance)
3. Export the test class
4. Import and use in `browser-test-runner.ts`

Example:
```typescript
// tests/new-feature-tests.ts
export class NewFeatureTests {
  constructor(page: Page, helpers: TestHelpers) {
    // Initialize
  }
  
  async testNewFeature(): Promise<void> {
    // Test implementation
  }
}
```

## Architecture Benefits

- **Modular**: Each test area is self-contained
- **Maintainable**: Easy to locate and modify specific tests
- **Scalable**: Add new test modules without affecting others
- **CLAUDE.md Compliant**: All files under 250 lines
- **Reusable**: Shared helpers reduce code duplication