/**
 * Authentication Controller
 * @module controllers/AuthController
 */

import { Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import type { IRegisterRequest } from '../types';

export class AuthController {
  /**
   * POST /api/auth/register
   * Register new user with evaluation service
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const data: IRegisterRequest = req.body;

    Logger.info('controller', 'Registration request', { email: data.email });

    const result = await authService.register(data);

    res.status(201).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * POST /api/auth/login
   * Authenticate user
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    Logger.info('controller', 'Login request', { email });

    const result = await authService.authenticate(email, password);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body;

    Logger.info('controller', 'Token refresh request');

    const result = await authService.refreshToken(refreshToken);

    res.status(200).json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });
}

export const authController = new AuthController();
