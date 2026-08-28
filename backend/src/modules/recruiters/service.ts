import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import type { RecruiterDTO } from './types.js';
import { RecruiterRepository } from './repository.js';

export class RecruiterService {
  constructor(private readonly repo: RecruiterRepository) {}

  async list(userId: string, query: Parameters<RecruiterRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<RecruiterDTO> {
    const recruiter = await this.repo.findById(userId, id);
    if (!recruiter) throw ApiError.notFound('Recruiter not found');
    return recruiter;
  }

  async create(userId: string, data: Parameters<RecruiterRepository['create']>[1]): Promise<RecruiterDTO> {
    const recruiter = await this.repo.create(userId, data);
    await auditService.log(userId, 'recruiter.create', 'recruiter', recruiter.id, { name: recruiter.name });
    return recruiter;
  }

  async update(userId: string, id: string, data: Parameters<RecruiterRepository['update']>[2]): Promise<RecruiterDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await auditService.log(userId, 'recruiter.update', 'recruiter', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'recruiter.delete', 'recruiter', id);
  }

  async pipeline(userId: string) {
    return this.repo.pipeline(userId);
  }
}
