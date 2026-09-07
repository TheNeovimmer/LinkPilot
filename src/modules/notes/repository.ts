import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { noteQuerySchema } from './schema';
import type { NoteDTO } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, scopeReadWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof noteQuerySchema>;

export class NoteRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.NoteWhereInput = scopeAndWhere(scope, {
      ...(query.pinned !== undefined ? { pinned: query.pinned } : {}),
      ...(query.tag ? { tags: { has: query.tag } } : {}),
      ...(query.q
        ? {
            OR: [
              { title: { contains: query.q, mode: 'insensitive' } },
              { content: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    });
    const rows = await prisma.note.findMany({
      where,
      orderBy: [
        { pinned: 'desc' },
        { [pickSort(query.sortBy, ['createdAt', 'updatedAt', 'title'], 'updatedAt')]: pickOrder(query.order) },
      ],
      ...prismaTakeSkip({ page, limit }),
    });
    const total = await prisma.note.count({ where });
    return { items: rows as NoteDTO[], meta: buildMeta({ page, limit }, total) };
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<NoteDTO | null> {
    const scope = normalizeScope(scopeInput);
    return prisma.note.findFirst({ where: scopeIdWhere(scope, id) }) as Promise<NoteDTO | null>;
  }

  async create(scopeInput: ScopeInput, data: { title: string; content?: string | null; pinned?: boolean; tags?: string[] }): Promise<NoteDTO> {
    const scope = normalizeScope(scopeInput);
    return prisma.note.create({ data: { ...scopeCreateData(scope), ...data } }) as Promise<NoteDTO>;
  }

  async update(scopeInput: ScopeInput, id: string, data: Partial<{ title: string; content: string | null; pinned: boolean; tags: string[] }>): Promise<NoteDTO | null> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.note.updateMany({ where: scopeIdWhere(scope, id), data });
    if (result.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.note.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }

  async tags(scopeInput: ScopeInput): Promise<string[]> {
    const scope = normalizeScope(scopeInput);
    const notes = await prisma.note.findMany({ where: scopeReadWhere(scope), select: { tags: true }, take: 1000 });
    const counts = new Map<string, number>();
    for (const note of notes) {
      for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag).slice(0, 30);
  }
}
