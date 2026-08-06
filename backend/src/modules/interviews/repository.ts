import type { Prisma, InterviewMode, InterviewStatus } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { interviewQuerySchema } from './schema.js';
import type { InterviewPrep } from '../../prompts/interviewPrep.js';
import type { InterviewDTO } from './types.js';

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
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.InterviewWhereInput = {
      userId,
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
    };
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
  async upcoming(userId: string, windowDays = 14): Promise<InterviewDTO[]> {
    const rows = await prisma.interview.findMany({
      where: {
        userId,
        status: 'SCHEDULED',
        scheduledAt: { gte: new Date(), lte: new Date(Date.now() + windowDays * 86_400_000) },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 20,
      include,
    });
    return rows.map(mapInterview);
  }

  async findById(userId: string, id: string): Promise<InterviewDTO | null> {
    const row = await prisma.interview.findFirst({ where: { id, userId }, include });
    return row ? mapInterview(row) : null;
  }

  /** Slim view consumed by the AI service (prep generation). */
  async findAiView(userId: string, id: string) {
    const row = await prisma.interview.findFirst({
      where: { id, userId },
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
    userId: string,
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
    const row = await prisma.interview.create({ data: { userId, ...data }, include });
    return mapInterview(row);
  }

  async update(
    userId: string,
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
    const result = await prisma.interview.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.interview.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async updatePrep(userId: string, id: string, prep: InterviewPrep): Promise<void> {
    await prisma.interview.updateMany({
      where: { id, userId },
      data: { prep: prep as unknown as Prisma.InputJsonValue },
    });
  }
}
