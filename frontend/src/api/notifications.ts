/**
 * Notification API Service
 * @module api/notifications
 */

import { apiClient } from './client';
import type { 
  Notification, 
  NotificationFilters, 
  PaginatedResponse,
  NotificationType,
  NotificationPriority 
} from '../types';

export const notificationApi = {
  getNotifications: (params: {
    page?: number;
    limit?: number;
    notification_type?: NotificationType;
    priority?: NotificationPriority;
    isRead?: boolean;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => apiClient.get<PaginatedResponse<Notification>>('/notifications', { params }),

  getNotificationsCursor: (params: { cursor?: string; limit?: number }) =>
    apiClient.get<{ data: Notification[]; nextCursor: string | null }>('/notifications/cursor', { params }),

  getNotificationById: (id: string) =>
    apiClient.get<{ data: Notification }>(`/notifications/${id}`),

  createNotification: (data: Partial<Notification>) =>
    apiClient.post<{ data: Notification }>('/notifications', data),

  updateNotification: (id: string, data: Partial<Notification>) =>
    apiClient.put<{ data: Notification }>(`/notifications/${id}`, data),

  markAsRead: (id: string) =>
    apiClient.patch<{ data: Notification }>(`/notifications/${id}/read`),

  deleteNotification: (id: string) =>
    apiClient.delete(`/notifications/${id}`),

  bulkMarkAsRead: (ids: string[]) =>
    apiClient.post('/notifications/bulk/read', { notificationIds: ids, operation: 'markRead' }),

  bulkDelete: (ids: string[]) =>
    apiClient.post('/notifications/bulk/delete', { notificationIds: ids, operation: 'delete' }),

  getUnreadCount: () =>
    apiClient.get<{ data: { count: number } }>('/notifications/unread/count'),

  getPriorityInbox: (limit?: number) =>
    apiClient.get<{ data: Notification[] }>('/notifications/priority', { params: { limit } }),

  getRecentPlacements: () =>
    apiClient.get<{ data: Notification[] }>('/notifications/placements/recent'),

  getTopPriorityUnread: () =>
    apiClient.get<{ data: Notification[] }>('/notifications/priority/unread'),

  notifyAll: (data: {
    title: string;
    message: string;
    type: NotificationType;
    priority: NotificationPriority;
    recipientIds: string[];
  }) => apiClient.post('/notifications/notify-all', data)
};
