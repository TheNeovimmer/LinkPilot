import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { reminderQuerySchema } from './schema';
import type { ReminderDTO } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof reminderQuerySchema>;

export class ReminderRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.ReminderWhereInput = scopeAndWhere(scope, {
      ...(query.done !== undefined ? { done: query.done } : {}),
      ...(query.dueBefore ? { dueAt: { lte: new Date(query.dueBefore) } } : {}),
    });
    const rows = await prisma.reminder.findMany({
      where,
      orderBy: [{ done: 'asc' }, { [pickSort(query.sortBy, ['dueAt', 'createdAt', 'updatedAt'], 'dueAt')]: pickOrder(query.order, 'asc') }],
      ...prismaTakeSkip({ page, limit }),
    });
    const total = await prisma.reminder.count({ where });
    return { items: rows as ReminderDTO[], meta: buildMeta({ page, limit }, total) };
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<ReminderDTO | null> {
    const scope = normalizeScope(scopeInput);
    return prisma.reminder.findFirst({ where: scopeIdWhere(scope, id) }) as Promise<ReminderDTO | null>;
  }

  async create(scopeInput: ScopeInput, data: { title: string; body?: string | null; dueAt: Date; done?: boolean }): Promise<ReminderDTO> {
    const scope = normalizeScope(scopeInput);
    return prisma.reminder.create({ data: { ...scopeCreateData(scope), ...data } }) as Promise<ReminderDTO>;
  }

  async update(scopeInput: ScopeInput, id: string, data: Partial<{ title: string; body: string | null; dueAt: Date; done: boolean }>): Promise<ReminderDTO | null> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.reminder.updateMany({ where: scopeIdWhere(scope, id), data });
    if (result.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.reminder.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }

  /** Reminders that are due, not done, and never reminded — consumed by the cron worker. */
  async dueNow(scopeInput: ScopeInput, now: Date): Promise<ReminderDTO[]> {
    const scope = normalizeScope(scopeInput);
    return prisma.reminder.findMany({
      where: scopeAndWhere(scope, { done: false, remindedAt: null, dueAt: { lte: now } }),
      orderBy: { dueAt: 'asc' },
      take: 50,
    }) as Promise<ReminderDTO[]>;
  }

  /** Global due scan for the cron worker (system-level, no user scope). */
  async dueNowAll(now: Date): Promise<ReminderDTO[]> {
    return prisma.reminder.findMany({
      where: { done: false, remindedAt: null, dueAt: { lte: now } },
      orderBy: { dueAt: 'asc' },
      take: 200,
    }) as Promise<ReminderDTO[]>;
  }

  async markReminded(id: string, now: Date): Promise<void> {
    await prisma.reminder.update({ where: { id }, data: { remindedAt: now } });
  }
}
