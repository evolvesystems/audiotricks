# API Key Migration Guide

## Overview

This guide documents the migration of API keys from client-side localStorage to secure backend storage.

## Current State (INSECURE)

- **OpenAI API keys**: Stored in `localStorage.getItem('openai_api_key')`
- **ElevenLabs API keys**: Stored in `localStorage.getItem('elevenlabs_api_key')`
- **Security Risk**: Keys are exposed in browser storage and network requests

## Target State (SECURE)

- **API keys**: Encrypted and stored in backend database
- **API calls**: Proxied through backend with server-side keys
- **Client**: Never sees or stores actual API keys

## Migration Strategy

### Phase 1: Backend API Implementation (Backend Team)

1. **Create API endpoints**:
   ```
   POST /api/settings/api-keys - Save encrypted keys
   GET /api/settings/api-keys - Check if user has keys
   DELETE /api/settings/api-keys - Remove keys
   ```

2. **Create proxy endpoints**:
   ```
   POST /api/proxy/openai/transcription - Proxy to OpenAI
   POST /api/proxy/openai/summary - Proxy to OpenAI
   POST /api/proxy/elevenlabs/text-to-speech - Proxy to ElevenLabs
   ```

### Phase 2: Frontend Migration (Current Implementation)

1. **New Components Created**:
   - `useApiKeys` hook - Manages API key storage
   - `apiProxy` service - Routes API calls through backend
   - `ApiKeyMigration` component - Helps users migrate keys
   - `SecureApiKeyInput` component - Unified key input

2. **Backward Compatibility**:
   - Falls back to localStorage if backend not ready
   - Continues to work for guest users
   - Shows migration prompt when appropriate

### Phase 3: Gradual Rollout

1. **Stage 1**: Deploy backend endpoints
2. **Stage 2**: Enable migration prompts for authenticated users
3. **Stage 3**: Switch API calls to use proxy
4. **Stage 4**: Remove localStorage usage completely

## Usage

### For Authenticated Users

```typescript
// In App.tsx or main component
import ApiKeyMigration from './components/ApiKeyMigration';

<ApiKeyMigration 
  token={authToken}
  isAuthenticated={!!user}
  onMigrationComplete={() => {
    // Refresh UI or show success
  }}
/>
```

### For API Key Input

```typescript
// Replace ApiKeyInput with SecureApiKeyInput
import SecureApiKeyInput from './components/SecureApiKeyInput';

<SecureApiKeyInput
  apiKey={apiKey}
  onApiKeyChange={handleApiKeyChange}
  isGuest={!user}
  token={authToken}
  keyType="openai"
/>
```

### For API Calls

```typescript
// Use apiProxy instead of direct fetch
import { apiProxy } from './services/apiProxy';

// Set token once when authenticated
apiProxy.setToken(authToken);

// Make API calls
const result = await apiProxy.transcribeAudio({
  audioFile: file,
  language: 'en'
});
```

## Security Benefits

1. **No Client-Side Storage**: API keys never stored in browser
2. **Encrypted Storage**: Keys encrypted at rest in database
3. **Access Control**: Keys tied to authenticated users
4. **Audit Trail**: All API usage can be tracked
5. **Rate Limiting**: Backend can implement per-user limits

## Migration Checklist

- [x] Create `useApiKeys` hook
- [x] Create `apiProxy` service
- [x] Create `ApiKeyMigration` component
- [x] Create `SecureApiKeyInput` component
- [ ] Update App.tsx to use new components
- [ ] Update all API calls to use proxy
- [ ] Test with backend endpoints
- [ ] Remove direct localStorage usage
- [ ] Update documentation

## Notes

- Guest users will continue using localStorage
- Backend endpoints must handle encryption/decryption
- Consider implementing key rotation features
- Add monitoring for API usage patterns