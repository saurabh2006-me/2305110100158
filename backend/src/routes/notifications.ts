/**
 * Notification Routes
 * @module routes/notifications
 */

import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticateToken } from '../middleware/auth';
import { validate, notificationCreateSchema, notificationUpdateSchema, bulkOperationSchema, bulkNotifySchema } from '../middleware/validation';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications with pagination, filtering, sorting
 * @access  Private
 * @query   page, limit, sortBy, sortOrder, type, priority, status, isRead, startDate, endDate, search
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   GET /api/notifications/cursor
 * @desc    Get notifications with cursor pagination (infinite scroll)
 * @access  Private
 * @query   cursor, limit
 */
router.get('/cursor', notificationController.getNotificationsCursor);

/**
 * @route   GET /api/notifications/priority
 * @desc    Get priority inbox notifications
 * @access  Private
 * @query   limit
 */
router.get('/priority', notificationController.getPriorityInbox);

/**
 * @route   GET /api/notifications/unread/count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get('/unread/count', notificationController.getUnreadCount);

/**
 * @route   GET /api/notifications/placements/recent
 * @desc    Get recent placement notifications (last 7 days)
 * @access  Private
 */
router.get('/placements/recent', notificationController.getRecentPlacements);

/**
 * @route   GET /api/notifications/priority/unread
 * @desc    Get top priority unread notifications
 * @access  Private
 */
router.get('/priority/unread', notificationController.getTopPriorityUnread);

/**
 * @route   POST /api/notifications
 * @desc    Create new notification
 * @access  Private
 */
router.post('/', validate(notificationCreateSchema), notificationController.createNotification);

/**
 * @route   POST /api/notifications/notify-all
 * @desc    Send bulk notifications
 * @access  Private (Admin/HR only)
 */
router.post('/notify-all', validate(bulkNotifySchema), notificationController.notifyAll);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get notification by ID
 * @access  Private
 */
router.get('/:id', notificationController.getNotificationById);

/**
 * @route   PUT /api/notifications/:id
 * @desc    Update notification
 * @access  Private
 */
router.put('/:id', validate(notificationUpdateSchema), notificationController.updateNotification);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

/**
 * @route   POST /api/notifications/bulk/read
 * @desc    Bulk mark as read
 * @access  Private
 */
router.post('/bulk/read', validate(bulkOperationSchema), notificationController.bulkMarkAsRead);

/**
 * @route   POST /api/notifications/bulk/delete
 * @desc    Bulk delete
 * @access  Private
 */
router.post('/bulk/delete', validate(bulkOperationSchema), notificationController.bulkDelete);

export default router;
