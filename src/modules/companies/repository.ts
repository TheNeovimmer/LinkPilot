import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination';
import type { z } from 'zod';
import type { companyQuerySchema } from './schema';
import type { CompanyDTO } from './types';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, type ScopeInput } from '../../server/scope';

type ListQuery = z.infer<typeof companyQuerySchema>;

const include = { _count: { select: { recruiters: true, jobs: true } } };

type CompanyRow = {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { recruiters: number; jobs: number };
};

function mapCompany(row: CompanyRow): CompanyDTO {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    website: row.website,
    location: row.location,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    recruiterCount: row._count?.recruiters ?? 0,
    jobCount: row._count?.jobs ?? 0,
  };
}

export class CompanyRepository {
  async list(scopeInput: ScopeInput, query: ListQuery) {
    const scope = normalizeScope(scopeInput);
    const { page, limit } = parsePagination(query);
    const where: Prisma.CompanyWhereInput = scopeAndWhere(scope, {
      ...(query.industry ? { industry: { contains: query.industry, mode: 'insensitive' } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { industry: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    });
    const rows = await prisma.company.findMany({
      where,
      orderBy: { [pickSort(query.sortBy, ['createdAt', 'updatedAt', 'name'], 'updatedAt')]: pickOrder(query.order) },
      ...prismaTakeSkip({ page, limit }),
      include,
    });
    const total = await prisma.company.count({ where });
    return { items: rows.map(mapCompany), meta: buildMeta({ page, limit }, total) };
  }

  /** Lightweight list (all companies, name + id) for dropdowns. */
  async all(scopeInput: ScopeInput): Promise<{ id: string; name: string }[]> {
    const scope = normalizeScope(scopeInput);
    return prisma.company.findMany({
      where: scopeAndWhere(scope),
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  async findById(scopeInput: ScopeInput, id: string): Promise<CompanyDTO | null> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.company.findFirst({ where: scopeIdWhere(scope, id), include });
    return row ? mapCompany(row) : null;
  }

  async create(scopeInput: ScopeInput, data: { name: string; industry?: string; website?: string; location?: string; notes?: string }): Promise<CompanyDTO> {
    const scope = normalizeScope(scopeInput);
    const row = await prisma.company.create({ data: { ...scopeCreateData(scope), ...data }, include });
    return mapCompany(row);
  }

  async update(scopeInput: ScopeInput, id: string, data: Partial<{ name: string; industry: string; website: string; location: string; notes: string }>): Promise<CompanyDTO | null> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.company.updateMany({ where: scopeIdWhere(scope, id), data });
    if (result.count === 0) return null;
    return this.findById(scope, id);
  }

  async remove(scopeInput: ScopeInput, id: string): Promise<boolean> {
    const scope = normalizeScope(scopeInput);
    const result = await prisma.company.deleteMany({ where: scopeIdWhere(scope, id) });
    return result.count > 0;
  }
}
