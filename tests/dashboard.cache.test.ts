import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dashboardCacheKey } from '../src/modules/dashboard/service';

describe('dashboardCacheKey', () => {
  it('isolates users and workspaces', () => {
    assert.equal(dashboardCacheKey({ userId: 'u1', orgId: 'o1' }), 'u1::o1');
    assert.notEqual(dashboardCacheKey({ userId: 'u1', orgId: 'o1' }), dashboardCacheKey({ userId: 'u2', orgId: 'o1' }));
    assert.notEqual(dashboardCacheKey({ userId: 'u1', orgId: 'o1' }), dashboardCacheKey({ userId: 'u1', orgId: 'o2' }));
  });
});
