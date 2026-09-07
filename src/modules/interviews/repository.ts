import type { Prisma, InterviewMode, InterviewStatus } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { interviewQuerySchema } from './schema';
import type { InterviewPrep } from '../../prompts/interviewPrep';
import type { InterviewDTO } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, scopeReadWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof interviewQuerySchema>;

const include = {
  job: { select: { title: true, company: { select: { name: true } } } },
  recruiter: { select: { name: true } },
};

type InterviewRow = {
  id: string;
  title: string;
  scheduledAt: Date;
  durationMin: number;
  mode: InterviewMode;
  status: InterviewStatus;
  location: string | null;
  feedback: string | null;
  prep: unknown;
  jobId: string | null;
  recruiterId: string | null;
  applicationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  job?: { title: string; company?: { name: string } | null } | null;
  recruiter?: { name: string } | null;
};

function mapInterview(row: InterviewRow): InterviewDTO {
  return {
    id: row.id,
    title: row.title,
    scheduledAt: row.scheduledAt,
    durationMin: row.durationMin,
    mode: row.mode,
    status: row.status,
    location: row.location,
    feedback: row.feedback,
    prep: row.prep as InterviewPrep | null,
    jobId: row.jobId,
    jobTitle: row.job?.title ?? null,
    companyName: row.job?.company?.name ?? null,
    recruiterId: row.recruiterId,
    recruiterName: row.recruiter?.name ?? null,
    applicationId: row.applicationId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class InterviewRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.InterviewWhereInput = scopeAndWhere(scope, {
      ...(query.status ? { status: query.status } : {}),
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.jobId ? { jobId: query.jobId } : {}),
      ...(query.from || query.to
        ? {
            scheduledAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    });
    const rows = await prisma.interview.findMany({
      where,
      orderBy: { [pickSort(query.sortBy, ['scheduledAt', 'createdAt', 'updatedAt'], 'scheduledAt')]: pickOrder(query.order, 'asc') },
      ...prismaTakeSkip({ page, limit }),
      include,
    });
    const total = await prisma.interview.count({ where });
    return { items: rows.map(mapInterview), meta: buildMeta({ page, limit }, total) };
  }

  /** Upcoming scheduled interviews. */
  async upcoming(scopeInput: ScopeInput, windowDays = 14): Promise<InterviewDTO[]> {
    const scope = normalizeScope(scopeInput);
    const rows = await prisma.interview.findMany({
      where: scopeAndWhere(scope, {
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date(), lte: new Date(Date.now() + windowDays * 86_400_000) },
      }),
      orderBy: { scheduledAt: 'asc' },
      take: 20,
      include,
    });
    return rows.map(mapInterview);
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<InterviewDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.interview.findFirst({ where: scopeIdWhere(scope, id), include });
    return row ? mapInterview(row) : null;
  }

  /** Slim view consumed by the AI service (prep generation). */
  async findAiView(scopeInput: ScopeInput, id: string) {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.interview.findFirst({
      where: scopeIdWhere(scope, id),
      select: {
        id: true,
        title: true,
        mode: true,
        scheduledAt: true,
        job: { select: { id: true, title: true, description: true, company: { select: { name: true } } } },
        recruiter: { select: { name: true } },
      },
    });
    return row;
  }

  async create(
    scopeInput: ScopeInput,
    data: {
      title: string;
      scheduledAt: Date;
      durationMin?: number;
      mode?: InterviewMode;
      status?: InterviewStatus;
      jobId?: string | null;
      applicationId?: string | null;
      recruiterId?: string | null;
      location?: string | null;
      feedback?: string | null;
    },
  ): Promise<InterviewDTO> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.interview.create({ data: { ...scopeCreateData(scope), ...data }, include });
    return mapInterview(row);
  }

  async update(
    scopeInput: ScopeInput,
    id: string,
    data: Partial<{
      title: string;
      scheduledAt: Date;
      durationMin: number;
      mode: InterviewMode;
      status: InterviewStatus;
      jobId: string | null;
      applicationId: string | null;
      recruiterId: string | null;
      location: string | null;
      feedback: string | null;
    }>,
  ): Promise<InterviewDTO | null> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.interview.updateMany({ where: scopeIdWhere(scope, id), data });
    if (result.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.interview.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }

  async updatePrep(scopeInput: ScopeInput, id: string, prep: InterviewPrep): Promise<void> {
    const scope = normalizeScope(scopeInput);
    await prisma.interview.updateMany({
      where: scopeIdWhere(scope, id),
      data: { prep: prep as unknown as Prisma.InputJsonValue },
    });
  }
}
