/**
 * Frontend Type Definitions
 */

export type NotificationType = 'placement' | 'result' | 'event' | 'announcement' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientId: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead?: boolean;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  token: string;
}

export type ThemeMode = 'light' | 'dark';

export interface IWebSocketMessage {
  type: 'notification' | 'ping' | 'pong' | 'auth' | 'error';
  payload?: unknown;
  timestamp: number;
}
