import { Request, Response } from 'express';
import { ApiKeyService } from '../services/security/api-key.service';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/error-handler';

const apiKeyService = new ApiKeyService();

/**
 * Store or update an API key
 */
export const storeApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider, apiKey, metadata } = req.body;

    if (!provider || !apiKey) {
      res.status(400).json({
        error: 'Provider and API key are required'
      });
      return;
    }

    const validProviders = ['openai', 'elevenlabs', 'custom'];
    if (!validProviders.includes(provider)) {
      res.status(400).json({
        error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
      });
      return;
    }

    // Validate the API key
    const isValid = await apiKeyService.validateKey(provider, apiKey);
    if (!isValid) {
      res.status(400).json({
        error: 'Invalid API key'
      });
      return;
    }

    // Store the key
    const keyInfo = await apiKeyService.storeKey(userId, provider, apiKey, metadata);

    res.json({
      success: true,
      keyInfo: {
        id: keyInfo.id,
        provider: keyInfo.provider,
        keyPrefix: keyInfo.keyPrefix,
        isActive: keyInfo.isActive,
        createdAt: keyInfo.createdAt
      }
    });
    return;

  } catch (error) {
    logger.error('Failed to store API key', { error });
    res.status(500).json({
      error: 'Failed to store API key',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * List all API keys for the user
 */
export const listApiKeys = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const keys = await apiKeyService.listKeys(userId);

    res.json({
      keys: keys.map(key => ({
        id: key.id,
        provider: key.provider,
        keyPrefix: key.keyPrefix,
        isActive: key.isActive,
        lastUsedAt: key.lastUsedAt,
        usageCount: key.usageCount,
        createdAt: key.createdAt
      }))
    });
    return;

  } catch (error) {
    logger.error('Failed to list API keys', { error });
    res.status(500).json({
      error: 'Failed to list API keys',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Validate an API key
 */
export const validateApiKey = async (req: Request, res: Response) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      res.status(400).json({
        error: 'Provider and API key are required'
      });
      return;
    }

    const isValid = await apiKeyService.validateKey(provider, apiKey);

    res.json({
      valid: isValid,
      provider
    });
    return;

  } catch (error) {
    logger.error('Failed to validate API key', { error });
    res.status(500).json({
      error: 'Failed to validate API key',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Deactivate an API key
 */
export const deactivateApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;

    if (!provider) {
      res.status(400).json({
        error: 'Provider is required'
      });
      return;
    }

    await apiKeyService.deactivateKey(userId, provider);

    res.json({
      success: true,
      message: 'API key deactivated'
    });
    return;

  } catch (error) {
    logger.error('Failed to deactivate API key', { error });
    res.status(500).json({
      error: 'Failed to deactivate API key',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Get usage statistics for an API key
 */
export const getApiKeyUsage = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;
    const { days = '30' } = req.query;

    if (!provider) {
      res.status(400).json({
        error: 'Provider is required'
      });
      return;
    }

    const stats = await apiKeyService.getUsageStats(
      userId,
      provider,
      parseInt(days as string)
    );

    if (!stats) {
      res.status(404).json({
        error: 'API key not found'
      });
      return;
    }

    res.json({
      provider,
      stats
    });
    return;

  } catch (error) {
    logger.error('Failed to get API key usage', { error });
    res.status(500).json({
      error: 'Failed to get API key usage',
      details: getErrorMessage(error)
    });
    return;
  }
};

/**
 * Test an API key by making a simple request
 */
export const testApiKey = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { provider } = req.params;

    // Retrieve the key
    const apiKey = await apiKeyService.getKey(userId, provider);
    
    if (!apiKey) {
      res.status(404).json({
        error: 'API key not found'
      });
      return;
    }

    // Test the key
    let testResult: any = {};
    
    switch (provider) {
      case 'openai':
        // Test OpenAI key by listing models
        const openaiResponse = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        });
        
        if (openaiResponse.ok) {
          const data = await openaiResponse.json() as { data: Array<{ id: string }> };
          testResult = {
            success: true,
            models: data.data.slice(0, 5).map((m) => m.id) // First 5 models
          };
        } else {
          testResult = {
            success: false,
            error: 'Invalid API key'
          };
        }
        break;

      case 'elevenlabs':
        // Test ElevenLabs key by getting user info
        const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/user', {
          headers: {
            'xi-api-key': apiKey
          }
        });
        
        if (elevenLabsResponse.ok) {
          const data = await elevenLabsResponse.json() as { subscription: any };
          testResult = {
            success: true,
            subscription: data.subscription
          };
        } else {
          testResult = {
            success: false,
            error: 'Invalid API key'
          };
        }
        break;

      default:
        testResult = {
          success: true,
          message: 'Custom keys cannot be tested automatically'
        };
    }

    res.json({
      provider,
      test: testResult
    });
    return;

  } catch (error) {
    logger.error('Failed to test API key', { error });
    res.status(500).json({
      error: 'Failed to test API key',
      details: getErrorMessage(error)
    });
    return;
  }
};