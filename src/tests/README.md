# AudioTricks Testing Guide

## 🧪 Testing Infrastructure

This project uses **Vitest** for unit testing with **React Testing Library** for component testing.

## 📁 Test Structure

```
tests/
├── components/      # Component tests
├── hooks/          # Custom hook tests
├── utils/          # Utility function tests
└── setup.ts        # Test environment setup
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm test -- --watch
```

## ✅ Test Requirements (per CLAUDE.md)

Each test file must include at least:
1. **Expected use case** - Normal functionality
2. **Edge case** - Boundary conditions
3. **Failure case** - Error handling

## 📝 Example Test Structure

```typescript
describe('ComponentName', () => {
  // Test 1: Expected use
  it('renders and functions normally', () => {
    // Test implementation
  })

  // Test 2: Edge case
  it('handles edge conditions gracefully', () => {
    // Test implementation
  })

  // Test 3: Failure case
  it('handles errors appropriately', () => {
    // Test implementation
  })
})
```

## 🔧 Test Utilities

- `@testing-library/react` - Component testing
- `@testing-library/user-event` - User interaction simulation
- `vitest` - Test runner and assertions
- `@testing-library/jest-dom` - Additional DOM matchers

## 📊 Coverage Goals

- Minimum 80% code coverage
- Focus on critical user paths
- Test error boundaries and edge cases