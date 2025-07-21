/**
 * Admin routes index - consolidates all admin route modules
 */

import { Router } from 'express';
import userRoutes from './user.routes';
import subscriptionRoutes from './subscription.routes';
import ewayRoutes from './eway.routes';

const router = Router();

// Mount admin route modules
router.use('/users', userRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/eway', ewayRoutes);

export default router;