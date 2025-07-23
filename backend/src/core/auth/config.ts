import { env } from '../../config/environment';

export interface AuthSettings {
  // API Key Configuration
  apiKeys: string[];
  apiKeyHeaderName: string;
  
  // JWT Configuration  
  jwtSecretKey: string;
  jwtAlgorithm: string;
  jwtExpireMinutes: number;
  
  // Feature Flags
  requireApiKey: boolean;
  requireUserAuth: boolean;
}

class AuthConfig {
  private settings: AuthSettings;

  constructor() {
    // Parse API keys from environment variable
    let apiKeys: string[] = [];
    try {
      if (env.API_KEYS) {
        apiKeys = JSON.parse(env.API_KEYS);
      }
    } catch (error) {
      console.error('Failed to parse API_KEYS from environment:', error);
      apiKeys = [];
    }

    this.settings = {
      // API Key Configuration
      apiKeys,
      apiKeyHeaderName: env.API_KEY_HEADER_NAME || 'X-API-Key',
      
      // JWT Configuration (using existing env vars)
      jwtSecretKey: env.JWT_SECRET,
      jwtAlgorithm: env.JWT_ALGORITHM || 'HS256',
      jwtExpireMinutes: parseInt(env.JWT_EXPIRE_MINUTES || '10080'), // 7 days default
      
      // Feature Flags
      requireApiKey: env.REQUIRE_API_KEY !== 'false', // default true
      requireUserAuth: env.REQUIRE_USER_AUTH === 'true' // default false
    };
  }

  get apiKeys(): string[] {
    return this.settings.apiKeys;
  }

  get apiKeyHeaderName(): string {
    return this.settings.apiKeyHeaderName;
  }

  get jwtSecretKey(): string {
    return this.settings.jwtSecretKey;
  }

  get jwtAlgorithm(): string {
    return this.settings.jwtAlgorithm;
  }

  get jwtExpireMinutes(): number {
    return this.settings.jwtExpireMinutes;
  }

  get requireApiKey(): boolean {
    return this.settings.requireApiKey;
  }

  get requireUserAuth(): boolean {
    return this.settings.requireUserAuth;
  }
}

export const authSettings = new AuthConfig();