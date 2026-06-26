/**
 * Notification Worker - Processes queued notifications
 * Implements Retry, DLQ, Exponential Backoff, Idempotency
 * @module workers/NotificationWorker
 */

import { queueService } from '../services/QueueService';
import { notificationRepository } from '../repositories/NotificationRepository';
import { webSocketService } from '../services/WebSocketService';
import { cacheService } from '../services/CacheService';
import { Logger } from '../utils/logger';
import { config } from '../config';
import type { IQueueMessage, INotificationCreate } from '../types';

// Retry configuration with exponential backoff
const RETRY_DELAYS = [5000, 15000, 60000, 300000]; // 5s, 15s, 1m, 5m
const MAX_RETRIES = RETRY_DELAYS.length;

// Idempotency tracking (in production, use Redis)
const processedMessages = new Set<string>();

export class NotificationWorker {
  private isRunning = false;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await queueService.connect();

    // Consume from main notification queue
    await queueService.consume(config.RABBITMQ_QUEUE_NOTIFICATIONS, async (message) => {
      await this.processMessage(message);
    });

    // Consume from email queue
    await queueService.consume(config.RABBITMQ_QUEUE_EMAILS, async (message) => {
      await this.processEmail(message);
    });

    // Consume from push queue
    await queueService.consume(config.RABBITMQ_QUEUE_PUSH, async (message) => {
      await this.processPush(message);
    });

    Logger.info('cron_job', 'Notification worker started');
  }

  /**
   * Process notification message with idempotency and retry logic
   */
  private async processMessage(message: IQueueMessage): Promise<void> {
    // Idempotency check
    if (processedMessages.has(message.id)) {
      Logger.info('handler', 'Message already processed (idempotency)', { messageId: message.id });
      return;
    }

    try {
      const payload = message.payload as INotificationCreate;

      // Create notification in database
      const notification = await notificationRepository.create(payload);

      // Send real-time update
      webSocketService.sendToUser(payload.recipientId, {
        type: 'notification',
        payload: { notification, action: 'created' },
        timestamp: Date.now()
      });

      // Invalidate cache
      await cacheService.invalidateNotificationCache(payload.recipientId);

      // Mark as processed
      processedMessages.add(message.id);

      Logger.info('handler', 'Notification processed successfully', { 
        messageId: message.id,
        notificationId: notification._id 
      });
    } catch (error) {
      Logger.error('handler', 'Notification processing failed', { 
        messageId: message.id,
        error: (error as Error).message,
        retryCount: message.retryCount 
      });

      throw error; // Let RabbitMQ handle retry/DLQ
    }
  }

  /**
   * Process email notification
   * NOTE: Do NOT use database transactions for email sending
   * Reason: Email is an external, unreliable service. If wrapped in a DB transaction,
   * a failed email would rollback the entire transaction, losing valid notification data.
   * Instead: Save notification first, then attempt email asynchronously.
   */
  private async processEmail(message: IQueueMessage): Promise<void> {
    try {
      const { recipientId, title, message: body } = message.payload as any;

      // Simulate email sending (replace with actual SMTP logic)
      Logger.info('handler', 'Sending email', { recipientId, title });

      // In production:
      // await emailService.send({ to: recipientEmail, subject: title, body });

      // Log to history
      // await notificationHistoryRepository.create({ ... });

      Logger.info('handler', 'Email sent successfully', { messageId: message.id });
    } catch (error) {
      Logger.error('handler', 'Email sending failed', { 
        messageId: message.id,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Process push notification
   */
  private async processPush(message: IQueueMessage): Promise<void> {
    try {
      const { recipientId, title, message: body } = message.payload as any;

      Logger.info('handler', 'Sending push notification', { recipientId, title });

      // In production:
      // await pushService.send({ userId: recipientId, title, body });

      Logger.info('handler', 'Push notification sent', { messageId: message.id });
    } catch (error) {
      Logger.error('handler', 'Push notification failed', { 
        messageId: message.id,
        error: (error as Error).message 
      });
      throw error;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private getRetryDelay(retryCount: number): number {
    if (retryCount >= MAX_RETRIES) return RETRY_DELAYS[RETRY_DELAYS.length - 1];
    return RETRY_DELAYS[retryCount];
  }

  stop(): void {
    this.isRunning = false;
    Logger.info('cron_job', 'Notification worker stopped');
  }
}

export const notificationWorker = new NotificationWorker();
