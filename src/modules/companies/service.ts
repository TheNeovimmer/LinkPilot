import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { CompanyDTO } from './types';
import { CompanyRepository } from './repository';
import { normalizeScope, type ScopeInput } from '../../server/scope';

export class CompanyService {
  constructor(private readonly repo: CompanyRepository) {}

  async list(scopeInput: ScopeInput, query: Parameters<CompanyRepository['list']>[1]) {
    return this.repo.list(scopeInput, query);
  }

  async all(scopeInput: ScopeInput) {
    return this.repo.all(scopeInput);
  }

  async get(scopeInput: ScopeInput, id: string): Promise<CompanyDTO> {
    const company = await this.repo.findById(scopeInput, id);
    if (!company) throw ApiError.notFound('Company not found');
    return company;
  }

  async create(scopeInput: ScopeInput, data: Parameters<CompanyRepository['create']>[1]): Promise<CompanyDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    const company = await this.repo.create(scopeInput, data);
    await auditService.log(userId, 'company.create', 'company', company.id, { name: company.name }, undefined, orgId || undefined);
    return company;
  }

  async update(scopeInput: ScopeInput, id: string, data: Parameters<CompanyRepository['update']>[2]): Promise<CompanyDTO> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    const updated = await this.repo.update(scopeInput, id, data);
    await auditService.log(userId, 'company.update', 'company', id, undefined, undefined, orgId || undefined);
    return updated!;
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<void> {
    const { userId, orgId } = normalizeScope(scopeInput);
    await this.get(scopeInput, id);
    await this.repo.remove(scopeInput, id);
    await auditService.log(userId, 'company.delete', 'company', id, undefined, undefined, orgId || undefined);
  }
}
