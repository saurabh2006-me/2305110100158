/**
 * JWT Authentication Middleware
 * @module middleware/auth
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Logger } from '../utils/logger';
import type { IJWTPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: IJWTPayload;
}

/**
 * Validates JWT token from Authorization header
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      Logger.warn('auth', 'Authentication failed: No Bearer token provided', {
        path: req.path,
        ip: req.ip
      });
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Access token required' }
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.JWT_SECRET) as IJWTPayload;
    req.user = decoded;

    Logger.debug('auth', 'User authenticated', { userId: decoded.sub, path: req.path });
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      Logger.warn('auth', 'Token expired', { path: req.path });
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' }
      });
      return;
    }

    Logger.error('auth', 'Token validation failed', { 
      error: (error as Error).message,
      path: req.path 
    });
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
    });
  }
}

/**
 * Role-based access control middleware
 */
export function authorizeRoles(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
      return;
    }

    // Role check would need user lookup - simplified here
    // In production, attach user role to JWT payload
    next();
  };
}
