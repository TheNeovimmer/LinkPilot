import { ApiError } from '../../utils/ApiError.js';
import { auditService } from '../audit/service.js';
import { cacheDel } from '../../database/redis.js';
import type { ReminderDTO } from './types.js';
import { ReminderRepository } from './repository.js';

export class ReminderService {
  constructor(private readonly repo: ReminderRepository) {}

  async list(userId: string, query: Parameters<ReminderRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async get(userId: string, id: string): Promise<ReminderDTO> {
    const reminder = await this.repo.findById(userId, id);
    if (!reminder) throw ApiError.notFound('Reminder not found');
    return reminder;
  }

  async create(userId: string, data: Parameters<ReminderRepository['create']>[1]): Promise<ReminderDTO> {
    const reminder = await this.repo.create(userId, data);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'reminder.create', 'reminder', reminder.id, { title: reminder.title });
    return reminder;
  }

  async update(userId: string, id: string, data: Parameters<ReminderRepository['update']>[2]): Promise<ReminderDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'reminder.update', 'reminder', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await cacheDel(`dashboard:${userId}`);
    await auditService.log(userId, 'reminder.delete', 'reminder', id);
  }
}
