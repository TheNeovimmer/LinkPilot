import express, { type Express } from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import swaggerUi from 'swagger-ui-express';
import { toNodeHandler } from 'better-auth/node';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { prisma } from './database/prisma.js';
import { requestId } from './middlewares/requestId.js';
import { apiLimiter } from './middlewares/rateLimit.js';
import { notFound, errorHandler } from './middlewares/error.js';
import { auth } from './modules/auth/auth.js';
import { authRouter } from './modules/auth/router.js';
import { userRouter } from './modules/users/router.js';
import { conversationRouter } from './modules/conversations/router.js';
import { messageRouter } from './modules/messages/router.js';
import { recruiterRouter } from './modules/recruiters/router.js';
import { companyRouter } from './modules/companies/router.js';
import { jobRouter } from './modules/jobs/router.js';
import { applicationRouter } from './modules/applications/router.js';
import { interviewRouter } from './modules/interviews/router.js';
import { noteRouter } from './modules/notes/router.js';
import { reminderRouter } from './modules/reminders/router.js';
import { notificationRouter } from './modules/notifications/router.js';
import { aiRouter } from './modules/ai/router.js';
import { auditRouter } from './modules/audit/router.js';
import { dashboardRouter } from './modules/dashboard/router.js';
import openapi from './openapi.json' with { type: 'json' };

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);

  // Uploads (avatars)
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
  app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR), { maxAge: '7d' }));

  // Security & plumbing
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  // Compression: never compress SSE streams.
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers.accept?.includes('text/event-stream')) return false;
        return compression.filter(req, res);
      },
    }),
  );
  app.use(requestId);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    morgan('combined', {
      stream: { write: (msg: string) => logger.info(msg.trim()) },
      skip: () => env.NODE_ENV === 'test',
    }),
  );
  app.use('/api', apiLimiter);

  // Auth (Better Auth handles its own routes at /api/auth/*)
  app.use('/api/auth', toNodeHandler(auth));

  // Health — pings Neon/Postgres so monitoring sees the real state.
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({
        status: 'ok',
        db: 'up',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Health check failed', err);
      res.status(503).json({ status: 'degraded', uptime: process.uptime(), timestamp: new Date().toISOString() });
    }
  });

  // API v1
  const v1 = express.Router();
  v1.use('/auth', authRouter);
  v1.use('/users', userRouter);
  v1.use('/conversations', conversationRouter);
  v1.use('/conversations/:conversationId/messages', messageRouter);
  v1.use('/recruiters', recruiterRouter);
  v1.use('/companies', companyRouter);
  v1.use('/jobs', jobRouter);
  v1.use('/applications', applicationRouter);
  v1.use('/interviews', interviewRouter);
  v1.use('/notes', noteRouter);
  v1.use('/reminders', reminderRouter);
  v1.use('/notifications', notificationRouter);
  v1.use('/ai', aiRouter);
  v1.use('/audit-logs', auditRouter);
  v1.use('/dashboard', dashboardRouter);
  app.use('/api/v1', v1);

  // OpenAPI docs
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi as never, { customSiteTitle: 'LinkPilot API' }));
  app.get('/docs.json', (_req, res) => res.json(openapi));

  // 404 + central error handler
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
