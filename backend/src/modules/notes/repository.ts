import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { noteQuerySchema } from './schema.js';
import type { NoteDTO } from './types.js';

type ListQuery = z.infer<typeof noteQuerySchema>;

export class NoteRepository {
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.NoteWhereInput = {
      userId,
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
    };
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

  async findById(userId: string, id: string): Promise<NoteDTO | null> {
    return prisma.note.findFirst({ where: { id, userId } }) as Promise<NoteDTO | null>;
  }

  async create(userId: string, data: { title: string; content?: string | null; pinned?: boolean; tags?: string[] }): Promise<NoteDTO> {
    return prisma.note.create({ data: { userId, ...data } }) as Promise<NoteDTO>;
  }

  async update(userId: string, id: string, data: Partial<{ title: string; content: string | null; pinned: boolean; tags: string[] }>): Promise<NoteDTO | null> {
    const result = await prisma.note.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.note.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async tags(userId: string): Promise<string[]> {
    const notes = await prisma.note.findMany({ where: { userId }, select: { tags: true }, take: 1000 });
    const counts = new Map<string, number>();
    for (const note of notes) {
      for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag).slice(0, 30);
  }
}
