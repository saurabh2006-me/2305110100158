/**
 * Notification Repository - Data Access Layer
 * Implements Repository Pattern for clean separation
 * @module repositories/NotificationRepository
 */

import { Notification, type INotificationDocument } from '../models/Notification';
import { NotificationHistory } from '../models/NotificationHistory';
import type { 
  INotificationCreate, 
  INotificationUpdate, 
  INotificationQuery,
  INotificationFilters,
  IPaginatedResponse,
  INotification,
  NotificationType,
  NotificationPriority
} from '../types';
import { Logger } from '../utils/logger';
import { config } from '../config';

export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(data: INotificationCreate): Promise<INotificationDocument> {
    try {
      const notification = await Notification.create(data);

      // Log to history
      await NotificationHistory.create({
        notificationId: notification._id,
        recipientId: notification.recipientId,
        action: 'created',
        channel: 'in_app',
        metadata: { priority: notification.priority, type: notification.type }
      });

      Logger.info('repository', 'Notification created', { 
        notificationId: notification._id,
        recipientId: notification.recipientId 
      });

      return notification;
    } catch (error) {
      Logger.error('repository', 'Failed to create notification', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<INotificationDocument | null> {
    return Notification.findById(id).populate('recipientId', 'name email').exec();
  }

  /**
   * Find notifications with filtering, pagination, and sorting
   */
  async findAll(query: INotificationQuery): Promise<IPaginatedResponse<INotificationDocument>> {
    const { page = 1, limit = config.DEFAULT_PAGE_SIZE, sortBy = 'createdAt', sortOrder = 'desc', filters = {} } = query;

    const skip = (page - 1) * limit;
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Build filter query
    const filterQuery = this.buildFilterQuery(filters);

    // Execute queries in parallel
    const [notifications, total] = await Promise.all([
      Notification.find(filterQuery)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('recipientId', 'name email')
        .lean()
        .exec(),
      Notification.countDocuments(filterQuery).exec()
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: notifications as INotificationDocument[],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Find notifications with cursor-based pagination (for infinite scroll)
   */
  async findWithCursor(
    filters: INotificationFilters,
    cursor?: string,
    limit: number = config.DEFAULT_PAGE_SIZE
  ): Promise<{ data: INotificationDocument[]; nextCursor: string | null }> {
    const filterQuery = this.buildFilterQuery(filters);

    if (cursor) {
      const cursorDate = new Date(Buffer.from(cursor, 'base64').toString());
      filterQuery.createdAt = { $lt: cursorDate };
    }

    const notifications = await Notification.find(filterQuery)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('recipientId', 'name email')
      .lean()
      .exec();

    const hasMore = notifications.length > limit;
    const data = notifications.slice(0, limit) as INotificationDocument[];

    const nextCursor = hasMore && data.length > 0
      ? Buffer.from(data[data.length - 1].createdAt!.toISOString()).toString('base64')
      : null;

    return { data, nextCursor };
  }

  /**
   * Update a notification
   */
  async update(id: string, data: INotificationUpdate): Promise<INotificationDocument | null> {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('recipientId', 'name email').exec();

    if (notification) {
      Logger.info('repository', 'Notification updated', { notificationId: id });
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<INotificationDocument | null> {
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { isRead: true, readAt: new Date(), status: 'read' } },
      { new: true }
    ).exec();

    if (notification) {
      await NotificationHistory.create({
        notificationId: notification._id,
        recipientId: notification.recipientId,
        action: 'read',
        channel: 'in_app'
      });

      Logger.info('repository', 'Notification marked as read', { notificationId: id });
    }

    return notification;
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<INotificationDocument | null> {
    const notification = await Notification.findByIdAndDelete(id).exec();

    if (notification) {
      await NotificationHistory.create({
        notificationId: notification._id,
        recipientId: notification.recipientId,
        action: 'deleted',
        channel: 'in_app'
      });

      Logger.info('repository', 'Notification deleted', { notificationId: id });
    }

    return notification;
  }

  /**
   * Bulk mark as read
   */
  async bulkMarkAsRead(ids: string[], userId: string): Promise<number> {
    const result = await Notification.updateMany(
      { _id: { $in: ids }, recipientId: userId },
      { $set: { isRead: true, readAt: new Date(), status: 'read' } }
    ).exec();

    // Create history entries
    const historyEntries = ids.map(id => ({
      notificationId: id,
      recipientId: userId,
      action: 'read' as const,
      channel: 'in_app' as const
    }));

    await NotificationHistory.insertMany(historyEntries);

    Logger.info('repository', 'Bulk mark as read', { count: result.modifiedCount, userId });

    return result.modifiedCount;
  }

  /**
   * Bulk delete
   */
  async bulkDelete(ids: string[], userId: string): Promise<number> {
    // Create history entries before deletion
    const historyEntries = ids.map(id => ({
      notificationId: id,
      recipientId: userId,
      action: 'deleted' as const,
      channel: 'in_app' as const
    }));

    await NotificationHistory.insertMany(historyEntries);

    const result = await Notification.deleteMany({
      _id: { $in: ids },
      recipientId: userId
    }).exec();

    Logger.info('repository', 'Bulk delete', { count: result.deletedCount, userId });

    return result.deletedCount;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      recipientId: userId,
      isRead: false,
      status: { $in: ['sent', 'delivered'] }
    }).exec();
  }

  /**
   * Get priority inbox notifications with scoring
   */
  async getPriorityInbox(userId: string, limit: number = 20): Promise<INotificationDocument[]> {
    const notifications = await Notification.find({
      recipientId: userId,
      status: { $nin: ['deleted'] }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit * 2) // Fetch more for scoring
    .lean()
    .exec();

    // Calculate priority scores and sort
    const scored = notifications.map(n => ({
      ...n,
      priorityScore: this.calculatePriorityScore(n as INotificationDocument)
    }));

    scored.sort((a, b) => b.priorityScore - a.priorityScore);

    return scored.slice(0, limit) as INotificationDocument[];
  }

  /**
   * Get notifications for last N days
   */
  async getRecentNotifications(userId: string, days: number = 7): Promise<INotificationDocument[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Notification.find({
      recipientId: userId,
      type: 'placement',
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  }

  /**
   * Get top priority unread notifications
   */
  async getTopPriorityUnread(userId: string, limit: number = 10): Promise<INotificationDocument[]> {
    return Notification.find({
      recipientId: userId,
      isRead: false,
      priority: { $in: ['high', 'urgent'] }
    })
    .sort({ priority: -1, createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
  }

  /**
   * Build filter query from filters object
   */
  private buildFilterQuery(filters: INotificationFilters): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filters.type) query.type = filters.type;
    if (filters.priority) query.priority = filters.priority;
    if (filters.status) query.status = filters.status;
    if (filters.isRead !== undefined) query.isRead = filters.isRead;

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) (query.createdAt as Record<string, Date>).$gte = filters.startDate;
      if (filters.endDate) (query.createdAt as Record<string, Date>).$lte = filters.endDate;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return query;
  }

  /**
   * Calculate priority score for a notification
   */
  private calculatePriorityScore(notification: INotificationDocument): number {
    const typeWeights: Record<string, number> = {
      placement: 100,
      result: 80,
      event: 60,
      announcement: 40,
      reminder: 20
    };

    const priorityWeights: Record<string, number> = {
      urgent: 50,
      high: 30,
      medium: 15,
      low: 5
    };

    const now = new Date().getTime();
    const createdAt = notification.createdAt?.getTime() || now;
    const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 50 - hoursSinceCreation);

    const unreadBoost = notification.isRead ? 0 : 25;

    return (typeWeights[notification.type] || 0) + 
           (priorityWeights[notification.priority] || 0) + 
           recencyScore + 
           unreadBoost;
  }
}

export const notificationRepository = new NotificationRepository();
