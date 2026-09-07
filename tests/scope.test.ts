import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeScope, scopeAndWhere, scopeCreateData, scopeIdWhere, scopeReadWhere } from '../src/server/scope';

describe('scopeReadWhere', () => {
  it('shares org rows plus caller legacy rows', () => {
    assert.deepEqual(scopeReadWhere({ userId: 'u1', orgId: 'o1' }), {
      OR: [{ orgId: 'o1' }, { orgId: null, userId: 'u1' }],
    });
  });
  it('empty orgId means personal rows only', () => {
    assert.deepEqual(scopeReadWhere({ userId: 'u1', orgId: '' }), { orgId: null, userId: 'u1' });
  });
});

describe('normalizeScope', () => {
  it('wraps legacy userId strings', () => {
    assert.deepEqual(normalizeScope('u1'), { userId: 'u1', orgId: '' });
    assert.deepEqual(normalizeScope({ userId: 'u1', orgId: 'o1' }), { userId: 'u1', orgId: 'o1' });
  });
});

describe('scopeAndWhere', () => {
  it('AND-combines scope with filters', () => {
    const w = scopeAndWhere({ userId: 'u1', orgId: 'o1' }, { status: 'X' }) as { AND: unknown[] };
    assert.equal(w.AND.length, 2);
  });
});

describe('scopeIdWhere', () => {
  it('guards id by scope', () => {
    const w = scopeIdWhere({ userId: 'u1', orgId: 'o1' }, 'r1') as { id: string; AND: unknown[] };
    assert.equal(w.id, 'r1');
    assert.equal(w.AND.length, 1);
  });
});

describe('scopeCreateData', () => {
  it('dual-writes user and org', () => {
    assert.deepEqual(scopeCreateData({ userId: 'u1', orgId: 'o1' }), { userId: 'u1', orgId: 'o1' });
  });
});
