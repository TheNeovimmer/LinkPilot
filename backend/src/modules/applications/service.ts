import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import type { ApplicationDTO } from './types.js';
import { ApplicationRepository } from './repository.js';

export class ApplicationService {
  constructor(private readonly repo: ApplicationRepository) {}

  async list(userId: string, query: Parameters<ApplicationRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<ApplicationDTO> {
    const application = await this.repo.findById(userId, id);
    if (!application) throw ApiError.notFound('Application not found');
    return application;
  }

  async create(userId: string, data: Parameters<ApplicationRepository['create']>[1]): Promise<ApplicationDTO> {
    const application = await this.repo.create(userId, data);
    await cacheDel(`dashboard:${userId}`, `applications:pipeline:${userId}`);
    await auditService.log(userId, 'application.create', 'application', application.id, { status: application.status });
    return application;
  }

  async update(userId: string, id: string, data: Parameters<ApplicationRepository['update']>[2]): Promise<ApplicationDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await cacheDel(`dashboard:${userId}`, `applications:pipeline:${userId}`);
    await auditService.log(userId, 'application.update', 'application', id, { status: updated?.status });
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await cacheDel(`dashboard:${userId}`, `applications:pipeline:${userId}`);
    await auditService.log(userId, 'application.delete', 'application', id);
  }

  async pipeline(userId: string) {
    return this.repo.pipeline(userId);
  }
}
