import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import { aiClient } from '../ai/client.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { prisma } from '../../database/prisma.js';
import { buildImportJobMessages, importJobSchema, type ImportJob } from '../../prompts/importJob.js';
import type { JobDTO } from './types.js';
import { JobRepository } from './repository.js';

export class JobService {
  constructor(private readonly repo: JobRepository) {}

  /** Best-effort: generate + persist a pgvector embedding for semantic search. */
  private async embedJob(job: JobDTO): Promise<void> {
    if (!env.AI_EMBEDDING_MODEL) return;
    try {
      const text = [
        job.title,
        job.companyName,
        job.description,
        job.location,
        job.remote ? 'remote' : null,
        job.salaryMin ? `salary ${job.salaryMin}` : null,
        job.salaryMax ? `salary ${job.salaryMax}` : null,
      ]
        .filter(Boolean)
        .join('\n');
      const vector = await aiClient.embed(text);
      await this.repo.updateEmbedding(job.id, vector);
    } catch (err) {
      logger.warn('Embedding generation failed', { jobId: job.id, error: (err as Error).message });
    }
  }

  async list(userId: string, query: Parameters<JobRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<JobDTO> {
    const job = await this.repo.findById(userId, id);
    if (!job) throw ApiError.notFound('Job not found');
    return job;
  }

  async create(userId: string, data: Parameters<JobRepository['create']>[1]): Promise<JobDTO> {
    const job = await this.repo.create(userId, data);
    void this.embedJob(job);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.create', 'job', job.id, { title: job.title });
    return job;
  }

  async update(userId: string, id: string, data: Parameters<JobRepository['update']>[2]): Promise<JobDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    if (updated) void this.embedJob(updated);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.update', 'job', id);
    return updated!;
  }

  /** Bulk status move (e.g. mark a batch of watchlist jobs as applied). */
  async bulkUpdate(userId: string, ids: string[], status: JobDTO['status']): Promise<number> {
    const result = await this.repo.bulkUpdate(userId, ids, status);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.bulkUpdate', 'job', undefined, { count: result, status });
    return result;
  }

  /** AI import: paste a job posting URL/text → structured job (reuses or creates the company). */
  async importFromText(userId: string, text: string): Promise<JobDTO> {
    if (!aiClient.isConfigured()) throw ApiError.aiNotConfigured();

    const extracted = await aiClient.chatJSON<ImportJob>({
      messages: buildImportJobMessages({ text }),
      schema: importJobSchema,
    });
    if (!extracted.title) throw ApiError.badRequest('Could not extract a job title from that text');

    // Reuse an existing company by name (case-insensitive), else create it.
    let companyId: string | null | undefined = extracted.companyName
      ? (
          await prisma.company.findFirst({
            where: { userId, name: { equals: extracted.companyName, mode: 'insensitive' } },
            select: { id: true },
          })
        )?.id
      : undefined;
    if (extracted.companyName && !companyId) {
      const company = await prisma.company.create({ data: { userId, name: extracted.companyName } });
      companyId = company.id;
    }

    const job = await this.repo.create(userId, {
      title: extracted.title,
      companyId: companyId ?? undefined,
      url: extracted.url ?? undefined,
      description: extracted.description ?? undefined,
      location: extracted.location ?? undefined,
      remote: extracted.remote,
      salaryMin: extracted.salaryMin ?? null,
      salaryMax: extracted.salaryMax ?? null,
      status: 'WATCHLIST',
    });
    void this.embedJob(job);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.import', 'job', job.id, { title: job.title, company: extracted.companyName });
    return job;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.delete', 'job', id);
  }

  async stats(userId: string) {
    return this.repo.stats(userId);
  }

  /** Embedding-based search (vector ops). Caller handles the fallback. */
  async semanticSearch(userId: string, embedding: number[], limit: number) {
    return this.repo.semanticSearch(userId, embedding, limit);
  }
}
