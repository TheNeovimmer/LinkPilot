import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { auditQuerySchema } from './schema.js';
import type { AuditLogDTO } from './types.js';

type ListQuery = z.infer<typeof auditQuerySchema>;

export class AuditLogRepository {
  async log(data: {
    userId?: string | null;
    action: string;
    entity?: string;
    entityId?: string;
    meta?: Prisma.InputJsonValue;
    ip?: string;
  }): Promise<void> {
    await prisma.auditLog.create({ data });
  }

  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.AuditLogWhereInput = {
      userId,
      ...(query.action ? { action: query.action } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...prismaTakeSkip({ page, limit }),
      }),
      prisma.auditLog.count({ where }),
    ]);
    return { items: rows as AuditLogDTO[], meta: buildMeta({ page, limit }, total) };
  }
}
