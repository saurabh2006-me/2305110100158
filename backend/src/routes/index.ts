/**
 * Route Exports
 * @module routes
 */

import { Router } from 'express';
import authRoutes from './auth';
import notificationRoutes from './notifications';

const router = Router();

router.use('/auth', authRoutes);
router.use('/notifications', notificationRoutes);

export default router;
