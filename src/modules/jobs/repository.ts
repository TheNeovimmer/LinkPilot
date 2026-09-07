import type { Prisma, JobStatus } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { jobQuerySchema } from './schema';
import type { JobAnalysis } from '../../prompts/analyzeJob';
import type { JobDTO, JobStats } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, scopeReadWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof jobQuerySchema>;

const include = {
  company: { select: { name: true } },
  _count: { select: { applications: true, interviews: true } },
};

/** Multi-word text search: match any term across title/description/company/location. */
function textSearch(q: string): Prisma.JobWhereInput {
  const terms = q.split(/\s+/).map((t) => t.trim()).filter(Boolean);
  if (terms.length === 0) return {};
  return {
    OR: terms.flatMap((term) => [
      { title: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
      { company: { name: { contains: term, mode: 'insensitive' } } },
      { location: { contains: term, mode: 'insensitive' } },
    ]),
  };
}

export class JobRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.JobWhereInput = scopeAndWhere(scope, {
      ...(query.status ? { status: query.status } : {}),
      ...(query.companyId ? { companyId: query.companyId } : {}),
      ...(query.remote !== undefined ? { remote: query.remote } : {}),
      ...(query.q ? textSearch(query.q) : {}),
    });

    const rows = await prisma.job.findMany({
      where,
      orderBy: { [pickSort(query.sortBy, ['createdAt', 'updatedAt', 'fitScore', 'title', 'salaryMax'], 'createdAt')]: pickOrder(query.order) },
      ...prismaTakeSkip({ page, limit }),
      include,
    });
    const total = await prisma.job.count({ where });
    return { items: rows.map(mapJob), meta: buildMeta({ page, limit }, total) };
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<JobDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.job.findFirst({ where: scopeIdWhere(scope, id), include });
    return row ? mapJob(row) : null;
  }

  /** Slim view consumed by the AI service. */
  async findAiView(scopeInput: ScopeInput, id: string) {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.job.findFirst({
      where: scopeIdWhere(scope, id),
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        remote: true,
        salaryMin: true,
        salaryMax: true,
        company: { select: { name: true } },
      },
    });
    return row;
  }

  async create(
    scopeInput: ScopeInput,
    data: {
      title: string;
      companyId?: string;
      url?: string;
      description?: string;
      location?: string;
      remote?: boolean;
      salaryMin?: number | null;
      salaryMax?: number | null;
      status?: JobStatus;
      postedAt?: Date | null;
    },
  ): Promise<JobDTO> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.job.create({ data: { ...scopeCreateData(scope), ...data }, include });
    return mapJob(row);
  }

  async update(
    scopeInput: ScopeInput,
    id: string,
    data: Partial<{
      title: string;
      companyId: string | null;
      url: string;
      description: string;
      location: string;
      remote: boolean;
      salaryMin: number | null;
      salaryMax: number | null;
      status: JobStatus;
      fitScore: number;
      analysis: Prisma.InputJsonValue;
      postedAt: Date | null;
    }>,
  ): Promise<JobDTO | null> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.job.updateMany({ where: scopeIdWhere(scope, id), data });
    if (result.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.job.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }

  async bulkUpdate(scopeInput: ScopeInput, ids: string[], status: JobStatus): Promise<number> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.job.updateMany({ where: { id: { in: ids }, AND: [scopeReadWhere(scope)] }, data: { status } });
    return result.count;
  }

  async updateAnalysis(scopeInput: ScopeInput, id: string, fitScore: number, analysis: JobAnalysis): Promise<void> {
    const scope = normalizeScope(scopeInput);
    await prisma.job.updateMany({
      where: scopeIdWhere(scope, id),
      data: { fitScore, analysis: analysis as unknown as Prisma.InputJsonValue },
    });
  }

  /** Persist an embedding for semantic search (optional feature). */
  async updateEmbedding(id: string, embedding: number[]): Promise<void> {
    await prisma.$executeRawUnsafe(
      'UPDATE "Job" SET embedding = $1::vector WHERE id = $2',
      `[${embedding.join(',')}]`,
      id,
    );
  }

  /** pgvector semantic search; falls back to caller if vector ops unavailable. */
  async semanticSearch(scopeInput: ScopeInput, embedding: number[], limit: number): Promise<JobDTO[]> {
    const scope = normalizeScope(scopeInput);
    const rows = await prisma.$queryRawUnsafe<JobRow[]>(
      `SELECT j.*, c.name AS "companyName",
              (SELECT count(*)::int FROM "Application" a WHERE a."jobId" = j.id) AS "applicationCount",
              (SELECT count(*)::int FROM "Interview" i WHERE i."jobId" = j.id) AS "interviewCount"
       FROM "Job" j LEFT JOIN "Company" c ON c.id = j."companyId"
       WHERE (j."orgId" = $1 OR (j."orgId" IS NULL AND j."userId" = $2)) AND j.embedding IS NOT NULL
       ORDER BY j.embedding <-> $3::vector
       LIMIT $4`,
      scope.orgId || '__none__',
      scope.userId,
      `[${embedding.join(',')}]`,
      limit,
    );
    return rows.map(mapJob);
  }

  async stats(scopeInput: ScopeInput): Promise<JobStats> {
    const scope = normalizeScope(scopeInput);
    const where = scopeReadWhere(scope);
    const grouped = await prisma.job.groupBy({ by: ['status'], where, _count: true });
    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count])) as Record<JobStatus, number>;
    const total = await prisma.job.count({ where });
    const analyzed = await prisma.job.count({ where: { AND: [where, { fitScore: { not: null } }] } });
    const avg = await prisma.job.aggregate({ where: { AND: [where, { fitScore: { not: null } }] }, _avg: { fitScore: true } });
    return {
      byStatus: {
        WATCHLIST: byStatus.WATCHLIST ?? 0,
        APPLIED: byStatus.APPLIED ?? 0,
        INTERVIEWING: byStatus.INTERVIEWING ?? 0,
        OFFER: byStatus.OFFER ?? 0,
        REJECTED: byStatus.REJECTED ?? 0,
        CLOSED: byStatus.CLOSED ?? 0,
      },
      total,
      analyzed,
      avgFitScore: avg._avg.fitScore,
    };
  }
}

type JobRow = Prisma.JobGetPayload<{ include: typeof include }>;

function mapJob(row: JobRow): JobDTO {
  return {
    id: row.id,
    companyId: row.companyId,
    companyName: row.company?.name ?? null,
    title: row.title,
    url: row.url,
    description: row.description,
    location: row.location,
    remote: row.remote,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    status: row.status,
    fitScore: row.fitScore,
    analysis: row.analysis as JobAnalysis | null,
    postedAt: row.postedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    applicationCount: row._count.applications,
    interviewCount: row._count.interviews,
  };
}
