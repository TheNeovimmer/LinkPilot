import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { RecruiterDTO } from './types';
import { RecruiterRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class RecruiterService {
  constructor(private readonly repo: RecruiterRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<RecruiterRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<RecruiterDTO> {
    const recruiter = await this.repo.findById(scopeInput, id);
    if (!recruiter) throw ApiError.notFound('Recruiter not found');
    return recruiter;
  }

  async create(scopeInput: ScopeInput, data: Parameters<RecruiterRepository['create']>[1]): Promise<RecruiterDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const recruiter = await this.repo.create(scopeInput, data);
    await auditService.log(userId, 'recruiter.create', 'recruiter', recruiter.id, { name: recruiter.name }, undefined, orgId || undefined);
    return recruiter;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<RecruiterRepository['update']>[2]): Promise<RecruiterDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    const updated = await this.repo.update(scopeInput, id, data);
    await auditService.log(userId, 'recruiter.update', 'recruiter', id, undefined, undefined, orgId || undefined);
    return updated!;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'recruiter.delete', 'recruiter', id, undefined, undefined, orgId || undefined);
  }

  async pipeline(scopeInput: ScopeInput) {
    return this.repo.pipeline(scopeInput);
  }
}
