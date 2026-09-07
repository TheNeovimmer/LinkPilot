import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { notificationQuerySchema } from './schema';
import type { NotificationDTO, NotificationType } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, scopeReadWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof notificationQuerySchema>;

export class NotificationRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.NotificationWhereInput = scopeAndWhere(scope, {
      ...(query.unread !== undefined ? { read: !query.unread } : {}),
    });
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...prismaTakeSkip({ page, limit }),
    });
    const total = await prisma.notification.count({ where });
    return { items: rows as NotificationDTO[], meta: buildMeta({ page, limit }, total) };
  }

  async unreadCount(scopeInput: ScopeInput): Promise<number> {
    const scope = normalizeScope(scopeInput);
    return prisma.notification.count({ where: scopeAndWhere(scope, { read: false }) });
  }

  async create(data: {
    userId: string;
    orgId?: string | null;
    type: NotificationType;
    title: string;
    body?: string;
    data?: Prisma.InputJsonValue;
  }): Promise<NotificationDTO> {
    return prisma.notification.create({ data }) as Promise<NotificationDTO>;
  }

  async markRead(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.notification.updateMany({ where: scopeIdWhere(scope, id), data: { read: true } });
    return result.count > 0;
  }

  async markAllRead(scopeInput: ScopeInput): Promise<number> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.notification.updateMany({ where: scopeAndWhere(scope, { read: false }), data: { read: true } });
    return result.count;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.notification.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }
}
