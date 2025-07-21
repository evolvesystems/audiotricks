# AudioTricks Frontend Integration Guide

## 🔗 Overview

This guide details how to integrate the AudioTricks frontend with the comprehensive backend API system. The backend provides secure audio processing, API key management, usage tracking, and multi-workspace support.

## 🚀 Quick Integration Steps

### 1. Update Environment Configuration

Create or update your `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:3001/api

# Feature Flags
VITE_ENABLE_SECURE_API_KEYS=true
VITE_ENABLE_WORKSPACE_FEATURES=true
VITE_ENABLE_ADMIN_PANEL=true

# Storage Configuration (for file validation)
VITE_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
VITE_DO_SPACES_BUCKET=audiotricks-storage
VITE_DO_CDN_ENDPOINT=https://audiotricks-storage.nyc3.cdn.digitaloceanspaces.com

# Development Settings
VITE_LOG_LEVEL=info
VITE_MOCK_API=false
```

### 2. Install Required Dependencies

```bash
npm install @tanstack/react-query axios lucide-react react-dropzone
```

### 3. Update Main App Component

Replace the existing `App.tsx` or create a new integration:

```typescript
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { BackendAudioUploader } from './components/AudioUploader/BackendAudioUploader';
import ApiKeyManager from './components/ApiKeyManager';

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Your app content */}
          <AudioTricksApp />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
```

## 🔧 Core Services Integration

### Authentication Service

The `AuthService` provides comprehensive user management:

```typescript
import AuthService from './services/auth.service';
import { useAuth } from './contexts/AuthContext';

// In your login component
const { login, error, loading } = useAuth();

const handleLogin = async (email: string, password: string) => {
  try {
    await login(email, password);
    // User is now authenticated and token is stored
  } catch (error) {
    // Error is automatically handled by AuthContext
    console.error('Login failed:', error);
  }
};
```

### File Upload Integration

Replace the existing AudioUploader with the backend-integrated version:

```typescript
import { BackendAudioUploader } from './components/AudioUploader/BackendAudioUploader';

function MyUploadPage() {
  const [result, setResult] = useState(null);
  
  const handleComplete = (processingResult: any) => {
    setResult(processingResult);
    // Handle the completed transcription/summary/analysis
  };

  const handleError = (error: string) => {
    // Handle upload or processing errors
    console.error('Processing error:', error);
  };

  return (
    <BackendAudioUploader
      workspaceId="your-workspace-id"
      onProcessingComplete={handleComplete}
      onError={handleError}
      defaultSettings={{
        language: 'en',
        model: 'gpt-3.5-turbo',
        temperature: 0.3
      }}
    />
  );
}
```

### API Key Management

Integrate the API key manager for user settings:

```typescript
import ApiKeyManager from './components/ApiKeyManager';

function SettingsPage() {
  const handleKeysUpdated = () => {
    // Refresh any components that depend on API key status
    console.log('API keys updated');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <ApiKeyManager onKeysUpdated={handleKeysUpdated} />
    </div>
  );
}
```

## 📊 Usage Tracking Integration

### Usage Dashboard Hook

Create a custom hook for usage data:

```typescript
import { useState, useEffect } from 'react';
import { apiClient, UsageData } from '../services/api';

export function useUsageData(workspaceId: string) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsage = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/usage/${workspaceId}`);
        setUsage(response.usage);
      } catch (error) {
        setError('Failed to load usage data');
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      loadUsage();
    }
  }, [workspaceId]);

  return { usage, loading, error };
}
```

### Usage Dashboard Component

```typescript
import React from 'react';
import { useUsageData } from '../hooks/useUsageData';

interface UsageDashboardProps {
  workspaceId: string;
}

export function UsageDashboard({ workspaceId }: UsageDashboardProps) {
  const { usage, loading, error } = useUsageData(workspaceId);

  if (loading) return <div>Loading usage data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!usage) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Storage Usage */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-900">Storage</h3>
        <div className="mt-2">
          <div className="flex justify-between text-sm">
            <span>Used: {formatBytes(usage.storage.used)}</span>
            <span>{usage.storage.percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${Math.min(usage.storage.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Processing Usage */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-900">Processing Minutes</h3>
        <div className="mt-2">
          <div className="flex justify-between text-sm">
            <span>{usage.processing.used} / {usage.processing.limit}</span>
            <span>{usage.processing.percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${Math.min(usage.processing.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* AI Tokens Usage */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold text-gray-900">AI Tokens</h3>
        <div className="mt-2">
          <div className="flex justify-between text-sm">
            <span>{usage.aiTokens.used.toLocaleString()} / {usage.aiTokens.limit.toLocaleString()}</span>
            <span>{usage.aiTokens.percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-purple-500 h-2 rounded-full"
              style={{ width: `${Math.min(usage.aiTokens.percentUsed, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: string): string {
  const num = parseInt(bytes);
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (num === 0) return '0 Bytes';
  const i = Math.floor(Math.log(num) / Math.log(1024));
  return Math.round(num / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
```

## 🔄 Real-time Processing Status

### Processing Status Hook

```typescript
import { useState, useEffect, useRef } from 'react';
import ProcessingService from '../services/processing.service';

export function useProcessingStatus(jobId: string | null) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const pollStatus = async () => {
      try {
        const result = await ProcessingService.getJobStatus(jobId);
        setStatus(result);
        
        // Stop polling if completed or failed
        if (result.status === 'completed' || result.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error('Failed to get job status:', error);
      }
    };

    setLoading(true);
    pollStatus().finally(() => setLoading(false));

    // Poll every 2 seconds
    intervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId]);

  return { status, loading };
}
```

## 🛠️ Error Handling

### Global Error Handler

```typescript
import { ApiError } from './services/api';

export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isQuotaError) {
      return `${error.message}${error.suggestion ? ` ${error.suggestion}` : ''}`;
    }
    if (error.isAuthError) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.isValidationError) {
      return `Invalid input: ${error.message}`;
    }
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}
```

### Error Boundary for API Errors

```typescript
import React from 'react';
import { handleApiError } from '../utils/errorHandler';

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: string | null;
}

export class ApiErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ApiErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    return {
      hasError: true,
      error: handleApiError(error)
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 mt-1">{this.state.error}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔐 Security Considerations

### CORS Configuration

Ensure your backend allows requests from your frontend domain:

```typescript
// Backend CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

### Token Security

- Tokens are automatically managed by the `tokenManager`
- Automatic logout on 401 responses
- Secure storage in localStorage
- HTTPS required in production

### API Key Protection

- Keys are encrypted before storage
- Never exposed in frontend code
- Validation before acceptance
- Regular usage monitoring

## 📱 Mobile Considerations

### Responsive Design

All components are built with mobile-first responsive design:

```css
/* Example responsive classes used */
.grid-cols-1.md:grid-cols-2.lg:grid-cols-3
.text-sm.md:text-base
.p-4.md:p-6
```

### Touch Interactions

- Large touch targets (min 44px)
- Drag and drop support
- Swipe gestures for mobile

## 🔧 Development Tools

### API Debugging

Enable API debugging in development:

```typescript
// In your .env.development
VITE_LOG_LEVEL=debug
VITE_API_DEBUG=true
```

### Mock Mode

For frontend development without backend:

```typescript
// In your .env.development
VITE_MOCK_API=true
```

## 🚢 Production Deployment

### Environment Variables

Production environment setup:

```env
VITE_API_URL=https://api.audiotricks.com/api
VITE_ENABLE_SECURE_API_KEYS=true
VITE_LOG_LEVEL=warn
VITE_MOCK_API=false
```

### Build Configuration

Update your `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true // Remove console.log in production
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

## 📊 Performance Optimization

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      }
    }
  }
});
```

### Bundle Optimization

- Lazy load components with `React.lazy()`
- Code splitting for different routes
- Tree shaking enabled
- Service worker for caching

## 📋 Migration Checklist

- [ ] Update environment variables
- [ ] Install new dependencies
- [ ] Replace AudioUploader component
- [ ] Add API key management
- [ ] Integrate usage tracking
- [ ] Update authentication flow
- [ ] Add error boundaries
- [ ] Test file upload and processing
- [ ] Verify API key management
- [ ] Test quota enforcement
- [ ] Configure production build

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Check backend CORS configuration
2. **401 Errors**: Verify JWT token handling
3. **File Upload Fails**: Check file size limits and MIME types
4. **API Key Validation**: Ensure correct format and provider
5. **Quota Exceeded**: Check usage limits and upgrade plan

### Debug Commands

```bash
# Check API connectivity
curl -X GET http://localhost:3001/api/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Check upload endpoint
curl -X POST http://localhost:3001/api/upload/initialize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"filename":"test.mp3","fileSize":1000000,"mimeType":"audio/mp3","workspaceId":"workspace-id"}'
```

This integration guide provides a comprehensive path to connect your AudioTricks frontend with the powerful backend system!