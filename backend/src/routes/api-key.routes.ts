import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  storeApiKey,
  listApiKeys,
  validateApiKey,
  deactivateApiKey,
  getApiKeyUsage,
  testApiKey
} from '../controllers/api-key.controller';

const router = Router();

// All API key routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/api-keys
 * @desc    Store or update an API key
 * @access  Private
 */
router.post('/', storeApiKey);

/**
 * @route   GET /api/api-keys
 * @desc    List all API keys for the user
 * @access  Private
 */
router.get('/', listApiKeys);

/**
 * @route   POST /api/api-keys/validate
 * @desc    Validate an API key
 * @access  Private
 */
router.post('/validate', validateApiKey);

/**
 * @route   DELETE /api/api-keys/:provider
 * @desc    Deactivate an API key
 * @access  Private
 */
router.delete('/:provider', deactivateApiKey);

/**
 * @route   GET /api/api-keys/:provider/usage
 * @desc    Get usage statistics for an API key
 * @access  Private
 */
router.get('/:provider/usage', getApiKeyUsage);

/**
 * @route   POST /api/api-keys/:provider/test
 * @desc    Test an API key
 * @access  Private
 */
router.post('/:provider/test', testApiKey);

export default router;