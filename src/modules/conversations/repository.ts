import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip } from '../../utils/pagination';
import type { ConversationDTO, ConversationListResult } from './types';
import type { z } from 'zod';
import type { conversationQuerySchema } from './schema';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof conversationQuerySchema>;

function toDTO(row: {
  id: string;
  contactName: string;
  contactLinkedInUrl: string | null;
  contactHeadline: string | null;
  companyId: string | null;
  recruiterId: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  pinned: boolean;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { messages: number };
  company?: { name: string } | null;
  recruiter?: { name: string } | null;
}): ConversationDTO {
  return {
    id: row.id,
    contactName: row.contactName,
    contactLinkedInUrl: row.contactLinkedInUrl,
    contactHeadline: row.contactHeadline,
    companyId: row.companyId,
    recruiterId: row.recruiterId,
    status: row.status,
    pinned: row.pinned,
    lastMessageAt: row.lastMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    messageCount: row._count?.messages ?? 0,
    companyName: row.company?.name ?? null,
    recruiterName: row.recruiter?.name ?? null,
  };
}

export class ConversationRepository {
  async list(scopeInput: ScopeInput, query: ListQuery): Promise<{ items: ConversationDTO[]; total: number }> {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.ConversationWhereInput = scopeAndWhere(scope, {
      ...(query.status ? { status: query.status } : {}),
      ...(query.recruiterId ? { recruiterId: query.recruiterId } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.q
        ? {
            OR: [
              { contactName: { contains: query.q, mode: 'insensitive' } },
              { contactHeadline: { contains: query.q, mode: 'insensitive' } },
              { recruiter: { name: { contains: query.q, mode: 'insensitive' } } },
              { company: { name: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    });

    const orderBy: Prisma.ConversationOrderByWithRelationInput = {
      [pickSort(query.sortBy, ['updatedAt', 'createdAt', 'lastMessageAt', 'contactName'], 'updatedAt')]:
        pickOrder(query.order),
    };

    const [rows, total] = await prisma.$transaction([
      prisma.conversation.findMany({
        where,
        orderBy,
        ...prismaTakeSkip({ page, limit }),
        include: {
          _count: { select: { messages: true } },
          company: { select: { name: true } },
          recruiter: { select: { name: true } },
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { items: rows.map(toDTO), total };
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<ConversationDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.conversation.findFirst({
      where: scopeIdWhere(scope, id),
      include: {
        _count: { select: { messages: true } },
        company: { select: { name: true } },
        recruiter: { select: { name: true } },
      },
    });
    return row ? toDTO(row) : null;
  }

  async create(
    scopeInput: ScopeInput,
    data: {
      contactName: string;
      contactLinkedInUrl?: string;
      contactHeadline?: string;
      companyId?: string;
      recruiterId?: string;
      status?: 'ACTIVE' | 'ARCHIVED';
      pinned?: boolean;
    },
  ): Promise<ConversationDTO> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.conversation.create({
      data: { ...scopeCreateData(scope), ...data },
      include: {
        _count: { select: { messages: true } },
        company: { select: { name: true } },
        recruiter: { select: { name: true } },
      },
    });
    return toDTO(row);
  }

  async update(
    scopeInput: ScopeInput,
    id: string,
    data: Partial<{
      contactName: string;
      contactLinkedInUrl: string;
      contactHeadline: string;
      companyId: string | null;
      recruiterId: string | null;
      status: 'ACTIVE' | 'ARCHIVED';
      pinned: boolean;
    }>,
  ): Promise<ConversationDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.conversation.updateMany({ where: scopeIdWhere(scope, id), data });
    if (row.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.conversation.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }

  /** Touch lastMessageAt after a message is added. */
  async touchLastMessage(conversationId: string): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });
  }
}

export type { ConversationListResult };
