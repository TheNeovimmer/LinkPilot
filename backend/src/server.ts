import { createServer } from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { connectRedis, disconnectRedis } from './database/redis.js';
import { prisma } from './database/prisma.js';
import { setupSocket } from './socket/index.js';
import { wireNotificationPublisher } from './modules/notifications/service.js';
import { publishNotification } from './socket/index.js';
import { startWorkers } from './workers/index.js';

async function bootstrap(): Promise<void> {
  // DB connectivity check (fast fail with a clear message).
  await prisma.$connect();
  logger.info('PostgreSQL connected');

  await connectRedis();

  const app = createApp();
  const server = createServer(app);
  const io = setupSocket(server);
  void io;

  // Wire socket publisher into the notification service singleton.
  wireNotificationPublisher(publishNotification);

  startWorkers();

  server.listen(env.PORT, () => {
    logger.info(`LinkPilot API listening on http://localhost:${env.PORT}`);
    logger.info(`Docs: http://localhost:${env.PORT}/docs`);
    logger.info(`AI: ${env.AI_BASE_URL} (model ${env.AI_MODEL})${env.AI_API_KEY ? '' : ' — AI_API_KEY not set, AI features disabled'}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close();
    await disconnectRedis().catch(() => {});
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
