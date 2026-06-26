/**
 * Input Validation Middleware using Zod
 * @module middleware/validation
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { Logger } from '../utils/logger';

/**
 * Generic validation middleware factory
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        Logger.warn('middleware', 'Validation failed', { 
          path: req.path,
          issues 
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: { issues }
          }
        });
        return;
      }
      next(error);
    }
  };
}

// Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  mobileNo: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number'),
  githubUsername: z.string().min(1, 'GitHub username is required'),
  rollNo: z.string().min(1, 'Roll number is required'),
  accessCode: z.string().min(1, 'Access code is required')
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const notificationCreateSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['placement', 'result', 'event', 'announcement', 'reminder']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient ID'),
  senderId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  metadata: z.record(z.unknown()).optional(),
  scheduledAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined),
  expiresAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined)
});

export const notificationUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(2000).optional(),
  type: z.enum(['placement', 'result', 'event', 'announcement', 'reminder']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  metadata: z.record(z.unknown()).optional(),
  expiresAt: z.string().datetime().optional().transform(str => str ? new Date(str) : undefined)
});

export const notificationQuerySchema = z.object({
  page: z.string().optional().transform(v => v ? parseInt(v, 10) : 1),
  limit: z.string().optional().transform(v => v ? parseInt(v, 10) : 20),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  type: z.enum(['placement', 'result', 'event', 'announcement', 'reminder']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).optional(),
  isRead: z.string().optional().transform(v => v === 'true'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional()
});

export const bulkOperationSchema = z.object({
  notificationIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  operation: z.enum(['markRead', 'markUnread', 'delete'])
});

export const bulkNotifySchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['placement', 'result', 'event', 'announcement', 'reminder']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  recipientIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  metadata: z.record(z.unknown()).optional()
});
