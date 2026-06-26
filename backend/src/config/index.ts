/**
 * Centralized Configuration Module
 * Loads and validates all environment variables
 * @module config
 */

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  API_BASE_URL: z.string().default('http://localhost:5000'),

  // Evaluation Service
  EVALUATION_SERVICE_URL: z.string().default('http://4.224.186.213/evaluation-service'),
  CLIENT_ID: z.string().min(1, 'CLIENT_ID is required'),
  CLIENT_SECRET: z.string().min(1, 'CLIENT_SECRET is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  JWT_REFRESH_SECRET: z.string().min(32),

  // MongoDB
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  MONGODB_TEST_URI: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number),

  // RabbitMQ
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  RABBITMQ_QUEUE_NOTIFICATIONS: z.string().default('notifications_queue'),
  RABBITMQ_QUEUE_EMAILS: z.string().default('emails_queue'),
  RABBITMQ_QUEUE_PUSH: z.string().default('push_queue'),
  RABBITMQ_DLQ: z.string().default('dead_letter_queue'),

  // WebSocket
  WS_PORT: z.string().default('5001').transform(Number),
  WS_HEARTBEAT_INTERVAL: z.string().default('30000').transform(Number),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),
  LOG_RETENTION_DAYS: z.string().default('30').transform(Number),

  // Pagination
  DEFAULT_PAGE_SIZE: z.string().default('20').transform(Number),
  MAX_PAGE_SIZE: z.string().default('100').transform(Number),

  // Cache
  CACHE_TTL_NOTIFICATIONS: z.string().default('300').transform(Number),
  CACHE_TTL_USER: z.string().default('600').transform(Number),
  CACHE_TTL_STATS: z.string().default('60').transform(Number),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;

export const isDev = config.NODE_ENV === 'development';
export const isProd = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
