/**
 * Core Type Definitions for Notification Platform
 * @module types
 */

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface IRegisterRequest {
  email: string;
  name: string;
  mobileNo: string;
  githubUsername: string;
  rollNo: string;
  accessCode: string;
}

export interface IAuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: IUserProfile;
}

export interface IUserProfile {
  id: string;
  email: string;
  name: string;
  mobileNo: string;
  githubUsername: string;
  rollNo: string;
}

export interface IJWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 'placement' | 'result' | 'event' | 'announcement' | 'reminder';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface INotification {
  _id?: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientId: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  scheduledAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationCreate {
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  recipientId: string;
  senderId?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface INotificationUpdate {
  title?: string;
  message?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

export interface INotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

export interface INotificationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: INotificationFilters;
}

export interface IPaginatedResponse<T> {
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

// ============================================
// USER TYPES
// ============================================

export interface IUser {
  _id?: string;
  email: string;
  name: string;
  mobileNo: string;
  githubUsername: string;
  rollNo: string;
  role: 'student' | 'admin' | 'hr';
  preferences?: IUserPreferences;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  notificationTypes: NotificationType[];
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

// ============================================
// NOTIFICATION HISTORY TYPES
// ============================================

export interface INotificationHistory {
  _id?: string;
  notificationId: string;
  recipientId: string;
  action: 'created' | 'sent' | 'delivered' | 'read' | 'deleted' | 'failed';
  channel: 'in_app' | 'email' | 'push' | 'sms';
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}

// ============================================
// LOGGING TYPES
// ============================================

export type LogStack = 'backend' | 'frontend';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type BackendPackage = 
  | 'cache' | 'controller' | 'cron_job' | 'db' 
  | 'domain' | 'handler' | 'repository' | 'route' | 'service';

export type FrontendPackage = 
  | 'api' | 'component' | 'hook' | 'page' | 'state' | 'style';

export type CommonPackage = 'auth' | 'config' | 'middleware' | 'utils';

export type LogPackage = BackendPackage | FrontendPackage | CommonPackage;

export interface ILogEntry {
  stack: LogStack;
  level: LogLevel;
  package: LogPackage;
  message: string;
  timestamp?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================
// QUEUE TYPES
// ============================================

export interface IQueueMessage {
  id: string;
  type: 'email' | 'push' | 'sms' | 'in_app';
  payload: unknown;
  priority: number;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
}

export interface IBulkNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  recipientIds: string[];
  metadata?: Record<string, unknown>;
}

// ============================================
// PRIORITY SCORE TYPES
// ============================================

export interface IPriorityScoreConfig {
  typeWeights: Record<NotificationType, number>;
  priorityWeights: Record<NotificationPriority, number>;
  recencyDecayFactor: number;
  unreadBoost: number;
}

export interface INotificationWithScore extends INotification {
  priorityScore: number;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface IErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

// ============================================
// WEBSOCKET TYPES
// ============================================

export interface IWebSocketMessage {
  type: 'notification' | 'ping' | 'pong' | 'auth' | 'error';
  payload?: unknown;
  timestamp: number;
}

export interface IWebSocketNotificationPayload {
  notification: INotification;
  action: 'created' | 'updated' | 'deleted';
}
