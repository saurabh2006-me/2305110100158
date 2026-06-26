/**
 * User Model - MongoDB Schema Definition
 * @module models/User
 */

import mongoose, { Schema, type Document } from 'mongoose';
import type { IUser, NotificationType } from '../types';

export interface IUserDocument extends IUser, Document {}

const UserPreferencesSchema = new Schema({
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },
  notificationTypes: [{ 
    type: String, 
    enum: ['placement', 'result', 'event', 'announcement', 'reminder'],
    default: ['placement', 'result', 'event', 'announcement', 'reminder']
  }],
  quietHoursStart: { type: String, default: '22:00' },
  quietHoursEnd: { type: String, default: '08:00' }
}, { _id: false });

const UserSchema = new Schema<IUserDocument>({
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  mobileNo: { 
    type: String, 
    required: [true, 'Mobile number is required'],
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid mobile number']
  },
  githubUsername: { 
    type: String, 
    required: [true, 'GitHub username is required'],
    trim: true
  },
  rollNo: { 
    type: String, 
    required: [true, 'Roll number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  role: { 
    type: String, 
    enum: ['student', 'admin', 'hr'],
    default: 'student'
  },
  preferences: { type: UserPreferencesSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ rollNo: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for notification count
UserSchema.virtual('notificationCount', {
  ref: 'Notification',
  localField: '_id',
  foreignField: 'recipientId',
  count: true,
  match: { isRead: false }
});

export const User = mongoose.model<IUserDocument>('User', UserSchema);
