/**
 * Rate Limiting Middleware
 * @module middleware/rateLimit
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { Logger } from '../utils/logger';

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    Logger.warn('middleware', 'Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later'
      }
    });
  },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  handler: (req, res) => {
    Logger.warn('middleware', 'Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests, please try again later'
      }
    });
  }
});
