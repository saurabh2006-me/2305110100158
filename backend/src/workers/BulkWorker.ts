/**
 * Bulk Notification Worker
 * Handles Notify All feature - 50,000 emails + 50,000 push notifications
 * @module workers/BulkWorker
 */

import { queueService } from '../services/QueueService';
import { userRepository } from '../repositories/UserRepository';
import { Logger } from '../utils/logger';
import type { IQueueMessage } from '../types';

// Rate limiting configuration
const RATE_LIMIT_EMAILS_PER_SECOND = 100;
const RATE_LIMIT_PUSH_PER_SECOND = 500;
const BATCH_SIZE = 100;

export class BulkWorker {
  private isRunning = false;
  private emailSemaphore = 0;
  private pushSemaphore = 0;

  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    await queueService.connect();

    // Start rate limiter intervals
    setInterval(() => { this.emailSemaphore = RATE_LIMIT_EMAILS_PER_SECOND; }, 1000);
    setInterval(() => { this.pushSemaphore = RATE_LIMIT_PUSH_PER_SECOND; }, 1000);

    Logger.info('cron_job', 'Bulk notification worker started');
  }

  /**
   * Process bulk notification request
   * Why sequential execution is bad:
   * 1. Synchronous processing blocks the event loop
   * 2. One failed email stops all subsequent emails
   * 3. No retry mechanism for individual failures
   * 4. No rate limiting - can overwhelm SMTP servers
   * 5. No partial failure recovery
   * 6. Memory exhaustion with large recipient lists
   */
  async processBulkNotifyAll(data: {
    title: string;
    message: string;
    type: string;
    priority: string;
    recipientIds: string[];
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { title, message, type, priority, recipientIds, metadata } = data;

    Logger.info('handler', 'Starting bulk notification process', { 
      totalRecipients: recipientIds.length 
    });

    // Process in batches to avoid memory issues
    for (let i = 0; i < recipientIds.length; i += BATCH_SIZE) {
      const batch = recipientIds.slice(i, i + BATCH_SIZE);

      // Create notification jobs for each recipient
      const jobs = batch.map(recipientId => ({
        id: `bulk_${Date.now()}_${recipientId}`,
        type: 'in_app' as const,
        payload: {
          title,
          message,
          type,
          priority,
          recipientId,
          metadata
        },
        priority: priority === 'urgent' ? 1 : 2,
        retryCount: 0,
        maxRetries: 3,
        createdAt: new Date()
      }));

      // Queue in-app notifications
      await queueService.publishBulk(jobs);

      // Queue email notifications (rate limited)
      for (const recipientId of batch) {
        while (this.emailSemaphore <= 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.emailSemaphore--;

        await queueService.publish(config.RABBITMQ_QUEUE_EMAILS, {
          id: `email_${Date.now()}_${recipientId}`,
          type: 'email',
          payload: { recipientId, title, message },
          priority: 2,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      // Queue push notifications (rate limited)
      for (const recipientId of batch) {
        while (this.pushSemaphore <= 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        this.pushSemaphore--;

        await queueService.publish(config.RABBITMQ_QUEUE_PUSH, {
          id: `push_${Date.now()}_${recipientId}`,
          type: 'push',
          payload: { recipientId, title, message },
          priority: 3,
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date()
        });
      }

      Logger.info('handler', 'Batch processed', { 
        batchIndex: i / BATCH_SIZE,
        batchSize: batch.length 
      });
    }

    Logger.info('handler', 'Bulk notification completed', { 
      totalRecipients: recipientIds.length 
    });
  }

  stop(): void {
    this.isRunning = false;
    Logger.info('cron_job', 'Bulk worker stopped');
  }
}

export const bulkWorker = new BulkWorker();
