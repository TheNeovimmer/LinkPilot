import type { Prisma } from '@prisma/client';
import { prisma } from '../../database/prisma.js';
import { parsePagination, pickOrder, pickSort, prismaTakeSkip, buildMeta } from '../../utils/pagination.js';
import type { z } from 'zod';
import type { companyQuerySchema } from './schema.js';
import type { CompanyDTO } from './types.js';

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
  async list(userId: string, query: ListQuery) {
    const { page, limit } = parsePagination(query);
    const where: Prisma.CompanyWhereInput = {
      userId,
      ...(query.industry ? { industry: { contains: query.industry, mode: 'insensitive' } } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: 'insensitive' } },
              { industry: { contains: query.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
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
  async all(userId: string): Promise<{ id: string; name: string }[]> {
    return prisma.company.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
  }

  async findById(userId: string, id: string): Promise<CompanyDTO | null> {
    const row = await prisma.company.findFirst({ where: { id, userId }, include });
    return row ? mapCompany(row) : null;
  }

  async create(userId: string, data: { name: string; industry?: string; website?: string; location?: string; notes?: string }): Promise<CompanyDTO> {
    const row = await prisma.company.create({ data: { userId, ...data }, include });
    return mapCompany(row);
  }

  async update(userId: string, id: string, data: Partial<{ name: string; industry: string; website: string; location: string; notes: string }>): Promise<CompanyDTO | null> {
    const result = await prisma.company.updateMany({ where: { id, userId }, data });
    if (result.count === 0) return null;
    return this.findById(userId, id);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.company.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }
}
