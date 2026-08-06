import { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { auth } from '../modules/auth/auth.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import type { NotificationDTO } from '../modules/notifications/types.js';

let io: Server | null = null;

/** Attach Socket.IO to the HTTP server with session auth. */
export function setupSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
    // behind nginx
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const session = await auth.api.getSession({ headers: { cookie: socket.handshake.headers.cookie } });
      if (!session?.user) return next(new Error('unauthorized'));
      socket.data.userId = session.user.id;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    logger.debug(`socket connected: ${socket.id} (user ${userId})`);
    socket.on('disconnect', () => logger.debug(`socket disconnected: ${socket.id}`));
  });

  logger.info('Socket.IO ready');
  return io;
}

/** Push a notification to a user's live connections (no-op if socket is down). */
export function publishNotification(userId: string, notification: NotificationDTO): void {
  io?.to(`user:${userId}`).emit('notification', notification);
}

export function getIo(): Server | null {
  return io;
}
