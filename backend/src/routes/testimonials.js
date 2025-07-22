/**
 * Stub testimonials route for compilation
 * Original implementation moved to temp-excluded directory
 */
import { Router } from 'express';

const router = Router();

// Stub endpoint
router.get('/', (_req, res) => {
  res.json({ message: 'Testimonials service temporarily disabled' });
});

export default router;