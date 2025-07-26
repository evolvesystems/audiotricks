import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for backend testing
 * Follows CLAUDE.md testing requirements
 */

export default defineConfig({
  test: {
    // Test environment setup
    environment: 'node',
    
    // Setup files for tests
    setupFiles: ['./src/tests/setup.ts'],
    
    // Test file patterns
    include: [
      'src/tests/**/*.test.ts',
      'src/tests/**/*.spec.ts'
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      '.git/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/**/*.ts'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/types/**',
        'src/migrations/**'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 80,
          lines: 80
        }
      }
    },
    
    // Test timeout
    testTimeout: 30000,
    
    
    // Mock configuration
    server: {
      deps: {
        inline: ['@prisma/client']
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  },
  
  // Define globals for tests
  define: {
    'process.env.NODE_ENV': '"test"'
  }
});