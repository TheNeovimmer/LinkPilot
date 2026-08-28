import { ApiError } from './ApiError';
import type { PaginationMeta } from './response';

export interface PaginateInput {
  page: number;
  limit: number;
}

/** Sortable field whitelist helper. */
export function pickSort(sortBy: unknown, allowed: readonly string[], fallback = 'createdAt'): string {
  return typeof sortBy === 'string' && allowed.includes(sortBy) ? sortBy : fallback;
}

export function pickOrder(order: unknown, fallback: 'asc' | 'desc' = 'desc'): 'asc' | 'desc' {
  return order === 'asc' ? 'asc' : order === 'desc' ? 'desc' : fallback;
}

/** Parse and clamp page/limit from query params. */
export function parsePagination(query: Record<string, unknown>): PaginateInput {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit };
}

export function buildMeta({ page, limit }: PaginateInput, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function prismaTakeSkip({ page, limit }: PaginateInput): { take: number; skip: number } {
  return { take: limit, skip: (page - 1) * limit };
}

/** Validate that a numeric string param is a positive int. */
export function parseIdParam(raw: unknown, name = 'id'): string {
  if (typeof raw !== 'string' || !/^[a-zA-Z0-9_-]{4,64}$/.test(raw)) {
    throw ApiError.badRequest(`Invalid ${name}`);
  }
  return raw;
}
