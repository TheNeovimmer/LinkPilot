import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import type { InterviewDTO } from './types.js';
import { InterviewRepository } from './repository.js';

export class InterviewService {
  constructor(private readonly repo: InterviewRepository) {}

  async list(userId: string, query: Parameters<InterviewRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async upcoming(userId: string) {
    return this.repo.upcoming(userId);
  }

  async get(userId: string, id: string): Promise<InterviewDTO> {
    const interview = await this.repo.findById(userId, id);
    if (!interview) throw ApiError.notFound('Interview not found');
    return interview;
  }

  async create(userId: string, data: Parameters<InterviewRepository['create']>[1]): Promise<InterviewDTO> {
    const interview = await this.repo.create(userId, data);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'interview.create', 'interview', interview.id, { title: interview.title });
    return interview;
  }

  async update(userId: string, id: string, data: Parameters<InterviewRepository['update']>[2]): Promise<InterviewDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'interview.update', 'interview', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'interview.delete', 'interview', id);
  }
}
