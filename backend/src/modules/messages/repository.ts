import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { messageListQuerySchema } from './schema.js';
import type { MessageDTO } from './types.js';

type ListQuery = z.infer<typeof messageListQuerySchema>;

export class MessageRepository {
  /** List messages for a conversation, oldest first. */
  async list(conversationId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.MessageWhereInput = {
      conversationId,
      ...(query.role ? { role: query.role } : {}),
    };
    const [rows, total] = await prisma.$transaction([
      prisma.message.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        ...prismaTakeSkip({ page, limit }),
      }),
      prisma.message.count({ where }),
    ]);
    return { items: rows as MessageDTO[], meta: buildMeta({ page, limit }, total) };
  }

  /** Last N messages (for AI context), oldest first. */
  async lastN(conversationId: string, n: number): Promise<MessageDTO[]> {
    const rows = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: n,
    });
    return (rows.reverse() as MessageDTO[]);
  }

  async create(conversationId: string, role: 'ME' | 'THEM', content: string): Promise<MessageDTO> {
    return prisma.message.create({ data: { conversationId, role, content } }) as Promise<MessageDTO>;
  }

  async findById(conversationId: string, id: string): Promise<MessageDTO | null> {
    return prisma.message.findFirst({ where: { id, conversationId } }) as Promise<MessageDTO | null>;
  }

  async update(conversationId: string, id: string, data: { role?: 'ME' | 'THEM'; content?: string }): Promise<MessageDTO | null> {
    const result = await prisma.message.updateMany({ where: { id, conversationId }, data });
    if (result.count === 0) return null;
    return this.findById(conversationId, id);
  }

  async remove(conversationId: string, id: string): Promise<boolean> {
    const result = await prisma.message.deleteMany({ where: { id, conversationId } });
    return result.count > 0;
  }

  async countByConversation(conversationId: string): Promise<number> {
    return prisma.message.count({ where: { conversationId } });
  }
}
