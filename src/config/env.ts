// Environment configuration
export const config = {
  // API Configuration - now everything runs on the same port
  apiUrl: import.meta.env.VITE_API_URL || '',  // Empty string means same origin
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  
  // Storage Configuration
  storage: {
    provider: import.meta.env.VITE_STORAGE_PROVIDER || 'local',
    digitalOcean: {
      spacesEndpoint: import.meta.env.VITE_DO_SPACES_ENDPOINT || '',
      bucket: import.meta.env.VITE_DO_SPACES_BUCKET || '',
      region: import.meta.env.VITE_DO_SPACES_REGION || 'nyc3',
      cdnEndpoint: import.meta.env.VITE_DO_CDN_ENDPOINT || ''
    }
  },
  
  // Feature Flags
  features: {
    secureApiKeys: import.meta.env.VITE_ENABLE_SECURE_API_KEYS === 'true',
    adminPanel: import.meta.env.VITE_ENABLE_ADMIN_PANEL === 'true',
    workspaces: import.meta.env.VITE_ENABLE_WORKSPACE_FEATURES === 'true'
  },
  
  // Development Settings
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  mockApi: import.meta.env.VITE_MOCK_API === 'true'
};

// Validate required environment variables
export function validateConfig() {
  const required = [];
  const missing = [];
  
  if (config.features.secureApiKeys && !config.apiUrl) {
    missing.push('VITE_API_URL');
  }
  
  if (config.storage.provider === 'digitalocean') {
    const doConfig = [
      { key: 'VITE_DO_SPACES_ENDPOINT', value: config.storage.digitalOcean.spacesEndpoint },
      { key: 'VITE_DO_SPACES_BUCKET', value: config.storage.digitalOcean.bucket }
    ];
    
    doConfig.forEach(({ key, value }) => {
      if (!value) missing.push(key);
    });
  }
  
  if (missing.length > 0) {
    console.warn(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return missing.length === 0;
}