import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import type { JobDTO } from './types.js';
import { JobRepository } from './repository.js';

export class JobService {
  constructor(private readonly repo: JobRepository) {}

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
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.create', 'job', job.id, { title: job.title });
    return job;
  }

  async update(userId: string, id: string, data: Parameters<JobRepository['update']>[2]): Promise<JobDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await cacheDel(`dashboard:${userId}`, `jobs:stats:${userId}`);
    await auditService.log(userId, 'job.update', 'job', id);
    return updated!;
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
