import type { Prisma, RecruiterStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { recruiterQuerySchema } from './schema.js';
import type { RecruiterDTO, RecruiterPipelineStats } from './types.js';

type ListQuery = z.infer<typeof recruiterQuerySchema>;

const include = {
  company: { select: { name: true } },
  _count: { select: { conversations: true } },
};

type RecruiterRow = {
  id: string;
  name: string;
  companyId: string | null;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: RecruiterStatus;
  lastContactAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  company?: { name: string } | null;
  _count?: { conversations: number };
};

function mapRecruiter(row: RecruiterRow): RecruiterDTO {
  return {
    id: row.id,
    name: row.name,
    companyId: row.companyId,
    companyName: row.company?.name ?? null,
    title: row.title,
    linkedinUrl: row.linkedinUrl,
    email: row.email,
    phone: row.phone,
    notes: row.notes,
    status: row.status,
    lastContactAt: row.lastContactAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    conversationCount: row._count?.conversations ?? 0,
  };
}

export class RecruiterRepository {
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.RecruiterWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { title: { contains: query.q, mode: 'insensitive' } },
              { company: { name: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const rows = await prisma.recruiter.findMany({
      where,
      orderBy: { [pickSort(query.sortBy, ['createdAt', 'updatedAt', 'name', 'lastContactAt'], 'updatedAt')]: pickOrder(query.order) },
      ...prismaTakeSkip({ page, limit }),
      include,
    });
    const total = await prisma.recruiter.count({ where });
    return { items: rows.map(mapRecruiter), meta: buildMeta({ page, limit }, total) };
  }

  async findById(userId: string, id: string): Promise<RecruiterDTO | null> {
    const row = await prisma.recruiter.findFirst({ where: { id, userId }, include });
    return row ? mapRecruiter(row) : null;
  }

  async create(userId: string, data: { name: string; companyId?: string; title?: string; linkedinUrl?: string; email?: string; phone?: string; notes?: string; status?: RecruiterStatus; lastContactAt?: Date | null }): Promise<RecruiterDTO> {
    const row = await prisma.recruiter.create({ data: { userId, ...data }, include });
    return mapRecruiter(row);
  }

  async update(userId: string, id: string, data: Partial<{ name: string; companyId: string | null; title: string; linkedinUrl: string; email: string; phone: string; notes: string; status: RecruiterStatus; lastContactAt: Date | null }>): Promise<RecruiterDTO | null> {
    const result = await prisma.recruiter.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.recruiter.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async pipeline(userId: string): Promise<RecruiterPipelineStats> {
    const grouped = await prisma.recruiter.groupBy({ by: ['status'], where: { userId }, _count: true });
    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<RecruiterStatus, number>;
    const total = await prisma.recruiter.count({ where: { userId } });
    const contactable = await prisma.recruiter.count({
      where: { userId, email: { not: null } },
    });
    return {
      byStatus: {
        NEW: byStatus.NEW ?? 0,
        CONTACTED: byStatus.CONTACTED ?? 0,
        RESPONDED: byStatus.RESPONDED ?? 0,
        INTERVIEW_SCHEDULED: byStatus.INTERVIEW_SCHEDULED ?? 0,
        OFFER: byStatus.OFFER ?? 0,
        REJECTED: byStatus.REJECTED ?? 0,
        INACTIVE: byStatus.INACTIVE ?? 0,
      },
      total,
      contactable,
    };
  }
}
