import { apiClient, ApiError, ApiKeyInfo } from './api';

export interface StoreApiKeyRequest {
  provider: 'openai' | 'elevenlabs' | 'custom';
  apiKey: string;
  metadata?: Record<string, any>;
}

export interface ValidateApiKeyRequest {
  provider: 'openai' | 'elevenlabs' | 'custom';
  apiKey: string;
}

export interface ValidateApiKeyResponse {
  valid: boolean;
  provider: string;
}

export interface ApiKeyUsageStats {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  errorCount: number;
  successRate: number;
  lastUsed: string | null;
}

export interface TestApiKeyResponse {
  provider: string;
  test: {
    success: boolean;
    error?: string;
    models?: string[];
    subscription?: any;
    message?: string;
  };
}

export class ApiKeyService {
  /**
   * Store an API key
   */
  static async storeApiKey(request: StoreApiKeyRequest): Promise<{
    success: boolean;
    keyInfo: ApiKeyInfo;
  }> {
    try {
      return await apiClient.post('/api-keys', request);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          if (error.message.includes('Invalid API key')) {
            throw new ApiError(400, 'The API key appears to be invalid. Please check and try again.');
          }
          if (error.message.includes('Provider')) {
            throw new ApiError(400, 'Invalid provider. Please select OpenAI or ElevenLabs.');
          }
        }
      }
      throw error;
    }
  }

  /**
   * List all API keys for the user
   */
  static async listApiKeys(): Promise<{ keys: ApiKeyInfo[] }> {
    return apiClient.get('/api-keys');
  }

  /**
   * Validate an API key before storing
   */
  static async validateApiKey(request: ValidateApiKeyRequest): Promise<ValidateApiKeyResponse> {
    return apiClient.post('/api-keys/validate', request);
  }

  /**
   * Delete/deactivate an API key
   */
  static async deleteApiKey(provider: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.delete(`/api-keys/${provider}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(404, 'API key not found');
      }
      throw error;
    }
  }

  /**
   * Get usage statistics for an API key
   */
  static async getApiKeyUsage(
    provider: string,
    days: number = 30
  ): Promise<{ provider: string; stats: ApiKeyUsageStats }> {
    try {
      return await apiClient.get(`/api-keys/${provider}/usage`, { days: days.toString() });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(404, 'API key not found');
      }
      throw error;
    }
  }

  /**
   * Test an API key
   */
  static async testApiKey(provider: string): Promise<TestApiKeyResponse> {
    try {
      return await apiClient.post(`/api-keys/${provider}/test`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new ApiError(404, 'API key not found. Please add your API key first.');
      }
      throw error;
    }
  }

  /**
   * Check if API key is configured for a provider
   */
  static async hasApiKey(provider: string): Promise<boolean> {
    try {
      const response = await this.listApiKeys();
      return response.keys.some(key => key.provider === provider && key.isActive);
    } catch (error) {
      return false;
    }
  }

  /**
   * Get API key info for a specific provider
   */
  static async getApiKeyInfo(provider: string): Promise<ApiKeyInfo | null> {
    try {
      const response = await this.listApiKeys();
      return response.keys.find(key => key.provider === provider && key.isActive) || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Validate API key format
   */
  static validateApiKeyFormat(provider: string, apiKey: string): { valid: boolean; error?: string } {
    if (!apiKey || apiKey.trim().length === 0) {
      return { valid: false, error: 'API key cannot be empty' };
    }

    switch (provider) {
      case 'openai':
        if (!apiKey.startsWith('sk-')) {
          return { valid: false, error: 'OpenAI API keys must start with "sk-"' };
        }
        if (apiKey.length < 20) {
          return { valid: false, error: 'OpenAI API key appears to be too short' };
        }
        break;

      case 'elevenlabs':
        if (apiKey.length < 30) {
          return { valid: false, error: 'ElevenLabs API key appears to be too short' };
        }
        // ElevenLabs keys are typically hex strings
        if (!/^[a-f0-9]+$/i.test(apiKey)) {
          return { valid: false, error: 'ElevenLabs API key should contain only letters and numbers' };
        }
        break;

      case 'custom':
        // No specific validation for custom keys
        break;

      default:
        return { valid: false, error: 'Unknown provider' };
    }

    return { valid: true };
  }

  /**
   * Get API key setup instructions
   */
  static getSetupInstructions(provider: string): {
    title: string;
    steps: string[];
    helpUrl?: string;
  } {
    switch (provider) {
      case 'openai':
        return {
          title: 'Setting up OpenAI API Key',
          steps: [
            'Go to https://platform.openai.com/api-keys',
            'Sign in to your OpenAI account',
            'Click "Create new secret key"',
            'Copy the API key (starts with "sk-")',
            'Paste it in the field above',
            'Click "Save" to store securely'
          ],
          helpUrl: 'https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key'
        };

      case 'elevenlabs':
        return {
          title: 'Setting up ElevenLabs API Key',
          steps: [
            'Go to https://elevenlabs.io/speech-synthesis',
            'Sign in to your ElevenLabs account',
            'Click on your profile in the top right',
            'Select "Profile"',
            'Copy your API key from the profile page',
            'Paste it in the field above',
            'Click "Save" to store securely'
          ],
          helpUrl: 'https://docs.elevenlabs.io/api-reference/authentication'
        };

      default:
        return {
          title: 'Setting up Custom API Key',
          steps: [
            'Obtain your API key from your service provider',
            'Ensure the key has the necessary permissions',
            'Paste it in the field above',
            'Click "Save" to store securely'
          ]
        };
    }
  }

  /**
   * Get provider display information
   */
  static getProviderInfo(provider: string): {
    name: string;
    description: string;
    icon?: string;
    website?: string;
  } {
    switch (provider) {
      case 'openai':
        return {
          name: 'OpenAI',
          description: 'For transcription (Whisper) and text analysis (GPT)',
          icon: '🤖',
          website: 'https://openai.com'
        };

      case 'elevenlabs':
        return {
          name: 'ElevenLabs',
          description: 'For high-quality voice synthesis and cloning',
          icon: '🗣️',
          website: 'https://elevenlabs.io'
        };

      case 'custom':
        return {
          name: 'Custom API',
          description: 'Custom API endpoint for specialized processing',
          icon: '⚙️'
        };

      default:
        return {
          name: provider,
          description: 'Unknown provider',
          icon: '❓'
        };
    }
  }

  /**
   * Format usage statistics for display
   */
  static formatUsageStats(stats: ApiKeyUsageStats): {
    formattedCalls: string;
    formattedCost: string;
    formattedTokens: string;
    successRatePercentage: string;
    lastUsedFormatted: string;
  } {
    return {
      formattedCalls: stats.totalCalls.toLocaleString(),
      formattedCost: `$${stats.totalCost.toFixed(4)}`,
      formattedTokens: stats.totalTokens.toLocaleString(),
      successRatePercentage: `${(stats.successRate * 100).toFixed(1)}%`,
      lastUsedFormatted: stats.lastUsed 
        ? new Date(stats.lastUsed).toLocaleDateString()
        : 'Never'
    };
  }

  /**
   * Check if API keys are required for processing
   */
  static getRequiredApiKeys(jobType: 'transcription' | 'summary' | 'analysis'): string[] {
    switch (jobType) {
      case 'transcription':
        return ['openai'];
      case 'summary':
      case 'analysis':
        return ['openai'];
      default:
        return [];
    }
  }

  /**
   * Validate that required API keys are configured
   */
  static async validateRequiredKeys(jobType: 'transcription' | 'summary' | 'analysis'): Promise<{
    valid: boolean;
    missing: string[];
  }> {
    const required = this.getRequiredApiKeys(jobType);
    const missing: string[] = [];

    for (const provider of required) {
      const hasKey = await this.hasApiKey(provider);
      if (!hasKey) {
        missing.push(provider);
      }
    }

    return {
      valid: missing.length === 0,
      missing
    };
  }
}

export default ApiKeyService;