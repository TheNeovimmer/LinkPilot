import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import type { CompanyDTO } from './types';
import { CompanyRepository } from './repository';

export class CompanyService {
  constructor(private readonly repo: CompanyRepository) {}

  async list(userId: string, query: Parameters<CompanyRepository['list']>[1]) {
    return this.repo.list(userId, query);
  }

  async all(userId: string) {
    return this.repo.all(userId);
  }

  async get(userId: string, id: string): Promise<CompanyDTO> {
    const company = await this.repo.findById(userId, id);
    if (!company) throw ApiError.notFound('Company not found');
    return company;
  }

  async create(userId: string, data: Parameters<CompanyRepository['create']>[1]): Promise<CompanyDTO> {
    const company = await this.repo.create(userId, data);
    await auditService.log(userId, 'company.create', 'company', company.id, { name: company.name });
    return company;
  }

  async update(userId: string, id: string, data: Parameters<CompanyRepository['update']>[2]): Promise<CompanyDTO> {
    await this.get(userId, id);
    const updated = await this.repo.update(userId, id, data);
    await auditService.log(userId, 'company.update', 'company', id);
    return updated!;
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.get(userId, id);
    await this.repo.remove(userId, id);
    await auditService.log(userId, 'company.delete', 'company', id);
  }
}
