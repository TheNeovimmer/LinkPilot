import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scopeCreateData, scopeIdWhere, scopeReadWhere } from '../src/server/scope';

describe('scopeReadWhere', () => {
  it('shares org rows plus caller legacy rows', () => {
    assert.deepEqual(scopeReadWhere({ userId: 'u1', orgId: 'o1' }), {
      OR: [{ orgId: 'o1' }, { orgId: null, userId: 'u1' }],
    });
  });
});

describe('scopeIdWhere', () => {
  it('guards id by scope', () => {
    const w = scopeIdWhere({ userId: 'u1', orgId: 'o1' }, 'r1') as { id: string; OR: unknown[] };
    assert.equal(w.id, 'r1');
    assert.equal(w.OR.length, 2);
  });
});

describe('scopeCreateData', () => {
  it('dual-writes user and org', () => {
    assert.deepEqual(scopeCreateData({ userId: 'u1', orgId: 'o1' }), { userId: 'u1', orgId: 'o1' });
  });
});
