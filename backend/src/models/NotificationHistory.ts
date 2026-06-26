/**
 * Notification History Model - Audit Trail
 * @module models/NotificationHistory
 */

import mongoose, { Schema, type Document } from 'mongoose';
import type { INotificationHistory } from '../types';

export interface INotificationHistoryDocument extends INotificationHistory, Document {}

const NotificationHistorySchema = new Schema<INotificationHistoryDocument>({
  notificationId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Notification',
    required: true,
    index: true
  },
  recipientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },
  action: { 
    type: String, 
    required: true,
    enum: ['created', 'sent', 'delivered', 'read', 'deleted', 'failed']
  },
  channel: { 
    type: String, 
    required: true,
    enum: ['in_app', 'email', 'push', 'sms']
  },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// Indexes for audit queries
NotificationHistorySchema.index({ notificationId: 1, createdAt: -1 });
NotificationHistorySchema.index({ recipientId: 1, createdAt: -1 });
NotificationHistorySchema.index({ action: 1, createdAt: -1 });
NotificationHistorySchema.index({ channel: 1, createdAt: -1 });

// TTL index - keep history for 1 year
NotificationHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export const NotificationHistory = mongoose.model<INotificationHistoryDocument>('NotificationHistory', NotificationHistorySchema);
