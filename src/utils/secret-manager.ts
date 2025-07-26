/**
 * Secret Manager - Secure handling of sensitive configuration
 * Implements environment-based configuration with validation
 */

import { logger } from './logger';
import { createDebugLogger } from './debug-logger';

const debug = createDebugLogger('secret-manager');

interface SecretConfig {
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  transformer?: (value: string) => any;
}

interface SecretDefinitions {
  [key: string]: SecretConfig;
}

class SecretManager {
  private secrets: Map<string, any> = new Map();
  private definitions: SecretDefinitions = {};
  private initialized = false;

  /**
   * Define secret configurations
   */
  defineSecrets(definitions: SecretDefinitions): void {
    this.definitions = { ...this.definitions, ...definitions };
    debug.log('Secrets defined', { keys: Object.keys(definitions) });
  }

  /**
   * Initialize secrets from environment
   */
  initialize(): void {
    if (this.initialized) {
      debug.warn('SecretManager already initialized');
      return;
    }

    const errors: string[] = [];
    const loaded: string[] = [];

    Object.entries(this.definitions).forEach(([key, config]) => {
      const envKey = `VITE_${key}`;
      const value = import.meta.env[envKey];

      if (!value && config.required) {
        errors.push(`Missing required secret: ${key} (${config.description})`);
        return;
      }

      if (value) {
        // Validate if validator provided
        if (config.validator && !config.validator(value)) {
          errors.push(`Invalid value for secret: ${key}`);
          return;
        }

        // Transform if transformer provided
        const finalValue = config.transformer ? config.transformer(value) : value;
        this.secrets.set(key, finalValue);
        loaded.push(key);
      }
    });

    if (errors.length > 0) {
      debug.error('Secret initialization failed', { errors });
      throw new Error(`Secret initialization failed:\n${errors.join('\n')}`);
    }

    this.initialized = true;
    debug.info('Secrets initialized successfully', { loaded });
  }

  /**
   * Get a secret value
   */
  get<T = string>(key: string): T {
    if (!this.initialized) {
      throw new Error('SecretManager not initialized');
    }

    const value = this.secrets.get(key);
    
    if (value === undefined && this.definitions[key]?.required) {
      throw new Error(`Required secret not found: ${key}`);
    }

    return value as T;
  }

  /**
   * Get a secret value or default
   */
  getOrDefault<T = string>(key: string, defaultValue: T): T {
    if (!this.initialized) {
      throw new Error('SecretManager not initialized');
    }

    const value = this.secrets.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * Check if a secret exists
   */
  has(key: string): boolean {
    return this.secrets.has(key);
  }

  /**
   * Get all secret keys (for debugging)
   */
  getKeys(): string[] {
    return Array.from(this.secrets.keys());
  }

  /**
   * Validate all secrets
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    Object.entries(this.definitions).forEach(([key, config]) => {
      const value = this.secrets.get(key);

      if (!value && config.required) {
        errors.push(`Missing required secret: ${key}`);
      } else if (value && config.validator && !config.validator(value)) {
        errors.push(`Invalid value for secret: ${key}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Create singleton instance
export const secretManager = new SecretManager();

// Define AudioTricks secrets
secretManager.defineSecrets({
  // API Keys
  OPENAI_API_KEY: {
    required: false,
    description: 'OpenAI API key for transcription and summarization',
    validator: (value) => value.startsWith('sk-') && value.length > 20
  },
  ELEVENLABS_API_KEY: {
    required: false,
    description: 'ElevenLabs API key for voice synthesis',
    validator: (value) => value.length > 20
  },
  
  // API Configuration
  API_URL: {
    required: false,
    description: 'Backend API URL',
    transformer: (value) => value.replace(/\/$/, '') // Remove trailing slash
  },
  API_TIMEOUT: {
    required: false,
    description: 'API request timeout in milliseconds',
    transformer: (value) => parseInt(value, 10),
    validator: (value) => !isNaN(parseInt(value, 10))
  },
  
  // Feature Flags
  ENABLE_SECURE_API_KEYS: {
    required: false,
    description: 'Enable secure API key storage',
    transformer: (value) => value === 'true'
  },
  ENABLE_ADMIN_PANEL: {
    required: false,
    description: 'Enable admin panel features',
    transformer: (value) => value === 'true'
  },
  ENABLE_WORKSPACE_FEATURES: {
    required: false,
    description: 'Enable workspace collaboration features',
    transformer: (value) => value === 'true'
  },
  
  // Storage Configuration
  STORAGE_PROVIDER: {
    required: false,
    description: 'Storage provider (digitalocean, local)',
    validator: (value) => ['digitalocean', 'local'].includes(value)
  },
  DO_SPACES_ENDPOINT: {
    required: false,
    description: 'DigitalOcean Spaces endpoint URL'
  },
  DO_SPACES_BUCKET: {
    required: false,
    description: 'DigitalOcean Spaces bucket name'
  },
  DO_CDN_ENDPOINT: {
    required: false,
    description: 'DigitalOcean CDN endpoint URL'
  },
  
  // Development
  LOG_LEVEL: {
    required: false,
    description: 'Logging level (debug, info, warn, error)',
    validator: (value) => ['debug', 'info', 'warn', 'error'].includes(value)
  },
  MOCK_API: {
    required: false,
    description: 'Use mock API for development',
    transformer: (value) => value === 'true'
  }
});

// Initialize on import
try {
  secretManager.initialize();
} catch (error) {
  logger.error('Failed to initialize secrets:', error);
}

// Export convenience functions
export const getSecret = <T = string>(key: string) => secretManager.get<T>(key);
export const getSecretOrDefault = <T = string>(key: string, defaultValue: T) => 
  secretManager.getOrDefault(key, defaultValue);
export const hasSecret = (key: string) => secretManager.has(key);
export const validateSecrets = () => secretManager.validate();