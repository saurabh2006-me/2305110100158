/**
 * Middleware Exports
 * @module middleware
 */

export { authenticateToken, authorizeRoles, type AuthenticatedRequest } from './auth';
export { 
  validate, 
  registerSchema, 
  loginSchema, 
  notificationCreateSchema, 
  notificationUpdateSchema,
  notificationQuerySchema,
  bulkOperationSchema,
  bulkNotifySchema
} from './validation';
export { 
  AppError, 
  NotFoundError, 
  BadRequestError, 
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  globalErrorHandler, 
  asyncHandler 
} from './errorHandler';
export { apiRateLimiter, strictRateLimiter } from './rateLimit';
