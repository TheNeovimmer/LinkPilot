import { describe, expect, it } from 'vitest';
import { buildMeta, parsePagination, pickOrder, pickSort, prismaTakeSkip } from '../src/utils/pagination.js';

describe('pagination utils', () => {
  it('parses and clamps page/limit', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20 });
    expect(parsePagination({ page: '3', limit: '5' })).toEqual({ page: 3, limit: 5 });
    expect(parsePagination({ page: '0', limit: '500' })).toEqual({ page: 1, limit: 100 });
    expect(parsePagination({ page: 'abc', limit: 'xyz' })).toEqual({ page: 1, limit: 20 });
  });

  it('builds meta with totalPages', () => {
    expect(buildMeta({ page: 2, limit: 10 }, 25)).toEqual({ page: 2, limit: 10, total: 25, totalPages: 3 });
    expect(buildMeta({ page: 1, limit: 10 }, 0)).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it('computes take/skip', () => {
    expect(prismaTakeSkip({ page: 3, limit: 10 })).toEqual({ take: 10, skip: 20 });
  });

  it('falls back to safe sort/order', () => {
    expect(pickSort('hack; DROP TABLE', ['createdAt'])).toBe('createdAt');
    expect(pickSort('createdAt', ['createdAt'])).toBe('createdAt');
    expect(pickOrder('desc')).toBe('desc');
    expect(pickOrder('sideways')).toBe('desc');
  });
});
