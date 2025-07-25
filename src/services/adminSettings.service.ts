import { logger } from '../utils/logger';
import { ApiKeySettings } from '../components/Admin/Settings/types';

const API_BASE_URL = '/api';

export interface AdminSettingsResponse {
  preferences?: any;
  apiKeys?: Partial<ApiKeySettings>;
  profile?: any;
}

export class AdminSettingsService {
  /**
   * Make authenticated request
   */
  private static async request(
    method: string,
    endpoint: string,
    token: string,
    body?: any
  ): Promise<any> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }
    return null;
  }

  /**
   * Get all admin settings
   */
  static async getSettings(token: string): Promise<AdminSettingsResponse> {
    try {
      // For now, fetch user API keys from the existing endpoint
      const apiKeysResponse = await this.request('GET', '/api-keys', token);
      
      // Map the response to our settings format
      const apiKeys: Partial<ApiKeySettings> = {};
      
      if (apiKeysResponse.keys) {
        apiKeysResponse.keys.forEach((key: any) => {
          if (key.provider === 'openai' && key.isActive) {
            apiKeys.openaiApiKey = '••••••••' + key.keyPrefix;
          }
          if (key.provider === 'elevenlabs' && key.isActive) {
            apiKeys.elevenlabsApiKey = '••••••••' + key.keyPrefix;
          }
        });
      }
      
      // Load other keys from localStorage (temporary solution)
      const sendgrid = localStorage.getItem('admin_sendgrid_key');
      const doKey = localStorage.getItem('admin_do_key');
      const doSecret = localStorage.getItem('admin_do_secret');
      const stripePub = localStorage.getItem('admin_stripe_pub');
      const stripeSecret = localStorage.getItem('admin_stripe_secret');
      const ewayKey = localStorage.getItem('admin_eway_key');
      const ewayPassword = localStorage.getItem('admin_eway_password');
      
      if (sendgrid) apiKeys.sendgridApiKey = sendgrid;
      if (doKey) apiKeys.digitaloceanSpacesKey = doKey;
      if (doSecret) apiKeys.digitaloceanSpacesSecret = doSecret;
      if (stripePub) apiKeys.stripePublishableKey = stripePub;
      if (stripeSecret) apiKeys.stripeSecretKey = stripeSecret;
      if (ewayKey) apiKeys.ewayApiKey = ewayKey;
      if (ewayPassword) apiKeys.ewayApiPassword = ewayPassword;
      
      return { apiKeys };
    } catch (error) {
      logger.error('Failed to fetch admin settings:', error);
      // Return empty object if settings don't exist yet
      return {};
    }
  }

  /**
   * Update API keys - Using the existing API key endpoint for now
   */
  static async updateApiKeys(token: string, apiKeys: Partial<ApiKeySettings>): Promise<void> {
    // For now, we'll only store OpenAI and ElevenLabs keys which are supported by the backend
    // Other keys would need a proper admin settings endpoint
    const promises: Promise<any>[] = [];
    
    if (apiKeys.openaiApiKey) {
      promises.push(
        this.request('POST', '/api-keys', token, {
          provider: 'openai',
          apiKey: apiKeys.openaiApiKey
        })
      );
    }
    
    if (apiKeys.elevenlabsApiKey) {
      promises.push(
        this.request('POST', '/api-keys', token, {
          provider: 'elevenlabs',
          apiKey: apiKeys.elevenlabsApiKey
        })
      );
    }
    
    // For now, we'll store other keys in localStorage as a temporary solution
    // TODO: Implement proper admin settings endpoint for system-wide API keys
    if (apiKeys.sendgridApiKey) localStorage.setItem('admin_sendgrid_key', apiKeys.sendgridApiKey);
    if (apiKeys.digitaloceanSpacesKey) localStorage.setItem('admin_do_key', apiKeys.digitaloceanSpacesKey);
    if (apiKeys.digitaloceanSpacesSecret) localStorage.setItem('admin_do_secret', apiKeys.digitaloceanSpacesSecret);
    if (apiKeys.stripePublishableKey) localStorage.setItem('admin_stripe_pub', apiKeys.stripePublishableKey);
    if (apiKeys.stripeSecretKey) localStorage.setItem('admin_stripe_secret', apiKeys.stripeSecretKey);
    if (apiKeys.ewayApiKey) localStorage.setItem('admin_eway_key', apiKeys.ewayApiKey);
    if (apiKeys.ewayApiPassword) localStorage.setItem('admin_eway_password', apiKeys.ewayApiPassword);
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }

  /**
   * Update preferences
   */
  static async updatePreferences(token: string, preferences: any): Promise<void> {
    return this.request('PUT', '/admin/settings/preferences', token, { preferences });
  }

  /**
   * Update profile
   */
  static async updateProfile(token: string, profile: any): Promise<void> {
    return this.request('PUT', '/admin/settings/profile', token, { profile });
  }

  /**
   * Change password
   */
  static async changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    return this.request('POST', '/admin/settings/change-password', token, {
      currentPassword,
      newPassword
    });
  }

  /**
   * Toggle 2FA
   */
  static async toggle2FA(token: string, enabled: boolean): Promise<void> {
    return this.request('POST', '/admin/settings/2fa', token, { enabled });
  }
}

export default AdminSettingsService;