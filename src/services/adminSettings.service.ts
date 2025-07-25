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
      return await this.request('GET', '/admin/settings', token);
    } catch (error) {
      logger.error('Failed to fetch admin settings:', error);
      // Return empty object if settings don't exist yet
      return {};
    }
  }

  /**
   * Update API keys
   */
  static async updateApiKeys(token: string, apiKeys: Partial<ApiKeySettings>): Promise<void> {
    return this.request('PUT', '/admin/settings/api-keys', token, { apiKeys });
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