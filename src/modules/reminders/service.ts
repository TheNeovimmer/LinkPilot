import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { ReminderDTO } from './types';
import { ReminderRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class ReminderService {
  constructor(private readonly repo: ReminderRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<ReminderRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<ReminderDTO> {
    const reminder = await this.repo.findById(scopeInput, id);
    if (!reminder) throw ApiError.notFound('Reminder not found');
    return reminder;
  }

  async create(scopeInput: ScopeInput, data: Parameters<ReminderRepository['create']>[1]): Promise<ReminderDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const reminder = await this.repo.create(scopeInput, data);
    await auditService.log(userId, 'reminder.create', 'reminder', reminder.id, { title: reminder.title }, undefined, orgId || undefined);
    return reminder;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<ReminderRepository['update']>[2]): Promise<ReminderDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    const updated = await this.repo.update(scopeInput, id, data);
    await auditService.log(userId, 'reminder.update', 'reminder', id, undefined, undefined, orgId || undefined);
    return updated!;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'reminder.delete', 'reminder', id, undefined, undefined, orgId || undefined);
  }
}
