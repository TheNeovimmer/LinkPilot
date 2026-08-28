import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { notificationQuerySchema } from './schema';
import type { NotificationDTO, NotificationType } from './types';

type ListQuery = z.infer<typeof notificationQuerySchema>;

export class NotificationRepository {
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unread !== undefined ? { read: !query.unread } : {}),
    };
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...prismaTakeSkip({ page, limit }),
    });
    const total = await prisma.notification.count({ where });
    return { items: rows as NotificationDTO[], meta: buildMeta({ page, limit }, total) };
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  }): Promise<NotificationDTO> {
    return prisma.notification.create({ data }) as Promise<NotificationDTO>;
  }

  async markRead(userId: string, id: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({ where: { id, userId }, data: { read: true } });
    return result.count > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return result.count;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.notification.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }
}
