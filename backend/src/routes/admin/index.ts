/**
 * Admin routes index - consolidates all admin route modules
 */

import { Router } from 'express';
import subscriptionRoutes from './subscription.routes';
import ewayRoutes from './eway.routes';

const router = Router();

// Mount admin route modules
router.use('/subscriptions', subscriptionRoutes);
router.use('/eway', ewayRoutes);

export default router;