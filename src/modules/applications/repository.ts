import type { Prisma, ApplicationStatus, ApplicationOfferFrequency, ApplicationOfferStatus } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { applicationQuerySchema } from './schema';
import type { ApplicationDTO, ApplicationPipelineStats } from './types';

type ListQuery = z.infer<typeof applicationQuerySchema>;

export type ApplicationInput = {
  jobId?: string | null;
  companyName?: string | null;
  roleTitle?: string | null;
  status?: ApplicationStatus;
  source?: string | null;
  firstResponseAt?: Date | null;
  appliedAt?: Date | null;
  notes?: string | null;
  coverLetter?: string | null;
  offerAmount?: number | null;
  offerCurrency?: string;
  offerFrequency?: ApplicationOfferFrequency;
  offerStatus?: ApplicationOfferStatus | null;
  offerNotes?: string | null;
};

const include = {
  job: { select: { title: true } },
  _count: { select: { interviews: true } },
};

type ApplicationRow = {
  id: string;
  jobId: string | null;
  companyName: string | null;
  roleTitle: string | null;
  status: ApplicationStatus;
  source: string | null;
  firstResponseAt: Date | null;
  appliedAt: Date | null;
  notes: string | null;
  coverLetter: string | null;
  offerAmount: number | null;
  offerCurrency: string;
  offerFrequency: ApplicationOfferFrequency;
  offerStatus: ApplicationOfferStatus | null;
  offerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  job?: { title: string } | null;
  _count?: { interviews: number };
};

function waitingDays(row: ApplicationRow): number | null {
  // Only meaningful once applied and still waiting on the employer.
  if (!row.appliedAt) return null;
  const awaiting = ['SUBMITTED', 'UNDER_REVIEW'].includes(row.status);
  if (!awaiting) return null;
  if (row.firstResponseAt && row.firstResponseAt <= row.appliedAt) return null;
  const from = row.firstResponseAt ?? row.appliedAt;
  return Math.max(0, Math.floor((Date.now() - from.getTime()) / 86_400_000));
}

function mapApplication(row: ApplicationRow): ApplicationDTO {
  return {
    id: row.id,
    jobId: row.jobId,
    jobTitle: row.job?.title ?? null,
    companyName: row.companyName,
    roleTitle: row.roleTitle,
    status: row.status,
    source: row.source,
    firstResponseAt: row.firstResponseAt,
    appliedAt: row.appliedAt,
    notes: row.notes,
    coverLetter: row.coverLetter,
    offerAmount: row.offerAmount,
    offerCurrency: row.offerCurrency,
    offerFrequency: row.offerFrequency,
    offerStatus: row.offerStatus,
    offerNotes: row.offerNotes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    interviewCount: row._count?.interviews ?? 0,
    waitingDays: waitingDays(row),
  };
}

export class ApplicationRepository {
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.ApplicationWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.q
        ? {
            OR: [
              { companyName: { contains: query.q, mode: 'insensitive' } },
              { roleTitle: { contains: query.q, mode: 'insensitive' } },
              { job: { title: { contains: query.q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const rows = await prisma.application.findMany({
      where,
      orderBy: { [pickSort(query.sortBy, ['createdAt', 'updatedAt', 'appliedAt', 'companyName'], 'updatedAt')]: pickOrder(query.order) },
      ...prismaTakeSkip({ page, limit }),
      include,
    });
    const total = await prisma.application.count({ where });
    return { items: rows.map(mapApplication), meta: buildMeta({ page, limit }, total) };
  }

  async findById(userId: string, id: string): Promise<ApplicationDTO | null> {
    const row = await prisma.application.findFirst({ where: { id, userId }, include });
    return row ? mapApplication(row) : null;
  }

  async create(userId: string, data: ApplicationInput): Promise<ApplicationDTO> {
    const row = await prisma.application.create({ data: { userId, ...data }, include });
    return mapApplication(row);
  }

  async update(userId: string, id: string, data: Partial<ApplicationInput>): Promise<ApplicationDTO | null> {
    const result = await prisma.application.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.application.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async pipeline(userId: string): Promise<ApplicationPipelineStats> {
    const grouped = await prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true });
    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<ApplicationStatus, number>;
    const total = await prisma.application.count({ where: { userId } });
    const active = await prisma.application.count({
      where: { userId, status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'INTERVIEWING'] } },
    });
    return {
      byStatus: {
        DRAFT: byStatus.DRAFT ?? 0,
        SUBMITTED: byStatus.SUBMITTED ?? 0,
        UNDER_REVIEW: byStatus.UNDER_REVIEW ?? 0,
        INTERVIEWING: byStatus.INTERVIEWING ?? 0,
        OFFER: byStatus.OFFER ?? 0,
        REJECTED: byStatus.REJECTED ?? 0,
        WITHDRAWN: byStatus.WITHDRAWN ?? 0,
      },
      total,
      active,
    };
  }
}
