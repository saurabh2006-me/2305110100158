/**
 * Main Server Entry Point
 * @module server
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import { createServer } from 'http';

import { config } from './config';
import { Logger, requestLogger } from './utils/logger';
import { globalErrorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimit';
import { cacheService } from './services/CacheService';
import { queueService } from './services/QueueService';
import { webSocketService } from './services/WebSocketService';
import { notificationWorker } from './workers/NotificationWorker';
import { bulkWorker } from './workers/BulkWorker';
import routes from './routes';

const app = express();
const server = createServer(app);

// ============================================
// SECURITY & PERFORMANCE MIDDLEWARE
// ============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: config.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Rate limiting
app.use(apiRateLimiter);

// Request logging
app.use(requestLogger);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.NODE_ENV,
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      cache: await cacheService.healthCheck() ? 'connected' : 'disconnected',
    }
  };

  const statusCode = Object.values(health.services).every(s => s === 'connected') ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================
// API ROUTES
// ============================================
app.use('/api', routes);

// ============================================
// WEBSOCKET
// ============================================
webSocketService.initialize(server);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use(globalErrorHandler);

// ============================================
// DATABASE CONNECTION
// ============================================
async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.MONGODB_URI);
    Logger.info('db', 'MongoDB connected', { uri: config.MONGODB_URI });
  } catch (error) {
    Logger.fatal('db', 'MongoDB connection failed', { error: (error as Error).message });
    process.exit(1);
  }
}

// ============================================
// START SERVER
// ============================================
async function startServer(): Promise<void> {
  await connectDatabase();
  await cacheService.connect();
  await queueService.connect();
  await notificationWorker.start();
  await bulkWorker.start();

  server.listen(config.PORT, () => {
    Logger.info('service', `Server running on port ${config.PORT}`, {
      environment: config.NODE_ENV,
      port: config.PORT
    });
  });
}

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
async function gracefulShutdown(signal: string): Promise<void> {
  Logger.info('service', `Received ${signal}, starting graceful shutdown...`);

  server.close(() => {
    Logger.info('service', 'HTTP server closed');
  });

  webSocketService.shutdown();
  notificationWorker.stop();
  bulkWorker.stop();
  await queueService.close();
  await cacheService.disconnect();
  await mongoose.connection.close();

  Logger.info('service', 'Graceful shutdown completed');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  Logger.fatal('service', 'Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  Logger.fatal('service', 'Unhandled rejection', { reason });
  process.exit(1);
});

startServer();

export default app;
