/**
 * Authentication Routes
 * @module routes/auth
 */

import { Router } from 'express';
import { authController } from '../controllers/AuthController';
import { validate, registerSchema } from '../middleware/validation';
import { strictRateLimiter } from '../middleware/rateLimit';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', strictRateLimiter, validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user
 * @access  Public
 */
router.post('/login', strictRateLimiter, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refresh);

export default router;
