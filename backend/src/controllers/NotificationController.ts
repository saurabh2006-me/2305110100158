/**
 * Notification Controller
 * @module controllers/NotificationController
 */

import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { Logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, BadRequestError } from '../middleware/errorHandler';
import type { AuthenticatedRequest } from '../middleware/auth';
import type { INotificationCreate, INotificationUpdate, INotificationQuery } from '../types';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get all notifications with pagination, filtering, sorting
   */
  getNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const query: INotificationQuery = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      filters: {
        type: req.query.notification_type as any,
        priority: req.query.priority as any,
        status: req.query.status as any,
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string
      }
    };

    Logger.info('controller', 'Get notifications', { userId, query });

    const result = await notificationService.getNotifications(userId, query);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * GET /api/notifications/cursor
   * Get notifications with cursor-based pagination (infinite scroll)
   */
  getNotificationsCursor = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const cursor = req.query.cursor as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    Logger.info('controller', 'Get notifications with cursor', { userId, cursor });

    const result = await notificationService.getNotificationsCursor(userId, cursor, limit);

    res.status(200).json({
      success: true,
      data: result.data,
      nextCursor: result.nextCursor,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * GET /api/notifications/:id
   * Get single notification by ID
   */
  getNotificationById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.sub;

    Logger.info('controller', 'Get notification by ID', { id, userId });

    const notification = await notificationService.getNotificationById(id, userId);

    res.status(200).json({
      success: true,
      data: notification,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * POST /api/notifications
   * Create new notification
   */
  createNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const data: INotificationCreate = req.body;

    Logger.info('controller', 'Create notification', { 
      recipientId: data.recipientId,
      type: data.type 
    });

    const notification = await notificationService.createNotification(data);

    res.status(201).json({
      success: true,
      data: notification,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * PUT /api/notifications/:id
   * Update notification
   */
  updateNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.sub;
    const data: INotificationUpdate = req.body;

    Logger.info('controller', 'Update notification', { id, userId });

    const notification = await notificationService.updateNotification(id, userId, data);

    res.status(200).json({
      success: true,
      data: notification,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.sub;

    Logger.info('controller', 'Mark notification as read', { id, userId });

    const notification = await notificationService.markAsRead(id, userId);

    res.status(200).json({
      success: true,
      data: notification,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  deleteNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user!.sub;

    Logger.info('controller', 'Delete notification', { id, userId });

    await notificationService.deleteNotification(id, userId);

    res.status(204).send();
  });

  /**
   * POST /api/notifications/bulk/read
   * Bulk mark as read
   */
  bulkMarkAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const { notificationIds } = req.body;

    Logger.info('controller', 'Bulk mark as read', { count: notificationIds.length, userId });

    const result = await notificationService.bulkMarkAsRead(notificationIds, userId);

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
   * POST /api/notifications/bulk/delete
   * Bulk delete
   */
  bulkDelete = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const { notificationIds } = req.body;

    Logger.info('controller', 'Bulk delete', { count: notificationIds.length, userId });

    const result = await notificationService.bulkDelete(notificationIds, userId);

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
   * GET /api/notifications/unread/count
   * Get unread notification count
   */
  getUnreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;

    Logger.info('controller', 'Get unread count', { userId });

    const result = await notificationService.getUnreadCount(userId);

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
   * GET /api/notifications/priority
   * Get priority inbox
   */
  getPriorityInbox = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    Logger.info('controller', 'Get priority inbox', { userId });

    const notifications = await notificationService.getPriorityInbox(userId, limit);

    res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * POST /api/notifications/notify-all
   * Send bulk notifications to all users
   */
  notifyAll = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { title, message, type, priority, recipientIds, metadata } = req.body;

    Logger.info('controller', 'Notify all request', { 
      count: recipientIds.length,
      type,
      priority 
    });

    const result = await notificationService.sendBulkNotifications({
      title,
      message,
      type,
      priority,
      recipientIds,
      metadata
    });

    res.status(202).json({
      success: true,
      data: {
        message: 'Notifications queued for delivery',
        queued: result.queued
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * GET /api/notifications/placements/recent
   * Get recent placement notifications (last 7 days)
   */
  getRecentPlacements = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;

    Logger.info('controller', 'Get recent placements', { userId });

    const notifications = await notificationService.getRecentPlacements(userId);

    res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });

  /**
   * GET /api/notifications/priority/unread
   * Get top priority unread notifications
   */
  getTopPriorityUnread = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user!.sub;

    Logger.info('controller', 'Get top priority unread', { userId });

    const notifications = await notificationService.getTopPriorityUnread(userId);

    res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).requestId
      }
    });
  });
}

export const notificationController = new NotificationController();
