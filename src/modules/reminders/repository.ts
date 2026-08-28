import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { reminderQuerySchema } from './schema';
import type { ReminderDTO } from './types';

type ListQuery = z.infer<typeof reminderQuerySchema>;

export class ReminderRepository {
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.ReminderWhereInput = {
      userId,
      ...(query.done !== undefined ? { done: query.done } : {}),
      ...(query.dueBefore ? { dueAt: { lte: new Date(query.dueBefore) } } : {}),
    };
    const rows = await prisma.reminder.findMany({
      where,
      orderBy: [{ done: 'asc' }, { [pickSort(query.sortBy, ['dueAt', 'createdAt', 'updatedAt'], 'dueAt')]: pickOrder(query.order, 'asc') }],
      ...prismaTakeSkip({ page, limit }),
    });
    const total = await prisma.reminder.count({ where });
    return { items: rows as ReminderDTO[], meta: buildMeta({ page, limit }, total) };
  }

  async findById(userId: string, id: string): Promise<ReminderDTO | null> {
    return prisma.reminder.findFirst({ where: { id, userId } }) as Promise<ReminderDTO | null>;
  }

  async create(userId: string, data: { title: string; body?: string | null; dueAt: Date; done?: boolean }): Promise<ReminderDTO> {
    return prisma.reminder.create({ data: { userId, ...data } }) as Promise<ReminderDTO>;
  }

  async update(userId: string, id: string, data: Partial<{ title: string; body: string | null; dueAt: Date; done: boolean }>): Promise<ReminderDTO | null> {
    const result = await prisma.reminder.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.reminder.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  /** Reminders that are due, not done, and never reminded — consumed by the cron worker. */
  async dueNow(userId: string, now: Date): Promise<ReminderDTO[]> {
    return prisma.reminder.findMany({
      where: { userId, done: false, remindedAt: null, dueAt: { lte: now } },
      orderBy: { dueAt: 'asc' },
      take: 50,
    }) as Promise<ReminderDTO[]>;
  }

  async markReminded(id: string, now: Date): Promise<void> {
    await prisma.reminder.update({ where: { id }, data: { remindedAt: now } });
  }
}
