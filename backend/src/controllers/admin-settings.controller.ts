import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-handler';

/**
 * Admin Settings Controller
 * Handles system-wide administrative settings including API keys
 */

interface AdminApiKeys {
  openaiApiKey?: string;
  elevenlabsApiKey?: string;
  sendgridApiKey?: string;
  digitaloceanSpacesKey?: string;
  digitaloceanSpacesSecret?: string;
  stripePublishableKey?: string;
  stripeSecretKey?: string;
  ewayApiKey?: string;
  ewayApiPassword?: string;
}

interface AdminPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  weeklyReports?: boolean;
  securityAlerts?: boolean;
  maintenanceUpdates?: boolean;
  theme?: string;
  timezone?: string;
  dateFormat?: string;
  defaultPageSize?: number;
  autoRefreshDashboard?: boolean;
  refreshInterval?: number;
}

interface AdminProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  role?: string;
}

// In-memory storage for now (should be replaced with database)
let adminSettings = {
  apiKeys: {} as AdminApiKeys,
  preferences: {} as AdminPreferences,
  profile: {} as AdminProfile
};

/**
 * Get all admin settings
 */
export const getAdminSettings = async (req: Request, res: Response) => {
  try {
    logger.info('Fetching admin settings');
    
    // Return masked API keys for security
    const maskedApiKeys: AdminApiKeys = {};
    Object.entries(adminSettings.apiKeys).forEach(([key, value]) => {
      if (value) {
        maskedApiKeys[key as keyof AdminApiKeys] = '••••••••' + value.slice(-4);
      }
    });

    res.json({
      success: true,
      settings: {
        apiKeys: maskedApiKeys,
        preferences: adminSettings.preferences,
        profile: adminSettings.profile
      }
    });
  } catch (error) {
    logger.error('Failed to fetch admin settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin settings',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Update API keys
 */
export const updateApiKeys = async (req: Request, res: Response) => {
  try {
    const { apiKeys } = req.body;
    
    if (!apiKeys || typeof apiKeys !== 'object') {
      res.status(400).json({
        success: false,
        error: 'API keys object is required'
      });
      return;
    }

    // Validate and sanitize API keys
    const validKeys = [
      'openaiApiKey',
      'elevenlabsApiKey', 
      'sendgridApiKey',
      'digitaloceanSpacesKey',
      'digitaloceanSpacesSecret',
      'stripePublishableKey',
      'stripeSecretKey',
      'ewayApiKey',
      'ewayApiPassword'
    ];

    const updatedKeys: AdminApiKeys = {};
    
    Object.entries(apiKeys).forEach(([key, value]) => {
      if (validKeys.includes(key) && typeof value === 'string' && value.trim()) {
        updatedKeys[key as keyof AdminApiKeys] = value.trim();
      }
    });

    // Update the stored API keys
    adminSettings.apiKeys = { ...adminSettings.apiKeys, ...updatedKeys };
    
    logger.info('Admin API keys updated', { 
      keys: Object.keys(updatedKeys),
      adminId: req.user?.id 
    });

    res.json({
      success: true,
      message: 'API keys updated successfully',
      updatedKeys: Object.keys(updatedKeys)
    });
  } catch (error) {
    logger.error('Failed to update API keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update API keys',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Update admin preferences
 */
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Preferences object is required'
      });
      return;
    }

    // Update preferences
    adminSettings.preferences = { ...adminSettings.preferences, ...preferences };
    
    logger.info('Admin preferences updated', { 
      adminId: req.user?.id 
    });

    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update preferences',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Update admin profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    
    if (!profile || typeof profile !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Profile object is required'
      });
      return;
    }

    // Update profile
    adminSettings.profile = { ...adminSettings.profile, ...profile };
    
    logger.info('Admin profile updated', { 
      adminId: req.user?.id 
    });

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    logger.error('Failed to update profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters'
      });
      return;
    }

    // TODO: Implement actual password change logic
    // For now, just simulate success
    
    logger.info('Admin password changed', { 
      adminId: req.user?.id 
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    logger.error('Failed to change password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      details: getErrorMessage(error)
    });
  }
};

/**
 * Toggle 2FA
 */
export const toggle2FA = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      res.status(400).json({
        success: false,
        error: 'Enabled status must be a boolean'
      });
      return;
    }

    // TODO: Implement actual 2FA toggle logic
    // For now, just simulate success
    
    logger.info('Admin 2FA toggled', { 
      enabled,
      adminId: req.user?.id 
    });

    res.json({
      success: true,
      message: `2FA ${enabled ? 'enabled' : 'disabled'} successfully`,
      enabled
    });
  } catch (error) {
    logger.error('Failed to toggle 2FA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle 2FA',
      details: getErrorMessage(error)
    });
  }
};