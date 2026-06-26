/**
 * Notification Model - MongoDB Schema Definition
 * @module models/Notification
 */

import mongoose, { Schema, type Document } from 'mongoose';
import type { INotification, NotificationType, NotificationPriority, NotificationStatus } from '../types';

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>({
  title: { 
    type: String, 
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: { 
    type: String, 
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: { 
    type: String, 
    required: [true, 'Type is required'],
    enum: ['placement', 'result', 'event', 'announcement', 'reminder']
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  recipientId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: [true, 'Recipient is required'],
    index: true
  },
  senderId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  metadata: { 
    type: Schema.Types.Mixed,
    default: {}
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true
  },
  readAt: { type: Date },
  scheduledAt: { type: Date },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  expiresAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ============================================
// CRITICAL INDEXES FOR PERFORMANCE
// ============================================

// Composite index for the slow query: studentID + isRead + createdAt
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: 1 });

// Covering index for unread notifications query
NotificationSchema.index({ recipientId: 1, isRead: 1, priority: 1, createdAt: -1 });

// Index for priority inbox sorting
NotificationSchema.index({ recipientId: 1, priority: 1, createdAt: -1 });

// Index for type filtering
NotificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });

// Index for date range queries
NotificationSchema.index({ recipientId: 1, createdAt: -1 });

// Index for scheduled notifications
NotificationSchema.index({ scheduledAt: 1, status: 1 });

// Index for expiration cleanup
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Text index for search
NotificationSchema.index({ title: 'text', message: 'text' });

// TTL index for old notifications (optional - remove if permanent storage needed)
// NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Compound index for bulk operations
NotificationSchema.index({ recipientId: 1, status: 1, type: 1 });

// Pre-save hook to set sentAt when status changes to sent
NotificationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static method for priority score calculation
NotificationSchema.statics.calculatePriorityScore = function(notification: INotificationDocument): number {
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
};

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
