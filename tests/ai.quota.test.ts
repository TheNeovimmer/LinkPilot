import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { aiQuotaKey, consumeAiQuota, resetAiQuota } from '../src/server/ai-quota';

describe('aiQuotaKey', () => {
  it('keys workspaces by org, personal scope by user', () => {
    assert.equal(aiQuotaKey({ userId: 'u1', orgId: 'o1' }), 'o1');
    assert.equal(aiQuotaKey({ userId: 'u1', orgId: '' }), 'user:u1');
  });
});

describe('consumeAiQuota', () => {
  it('allows up to the limit then blocks with a retry hint', () => {
    resetAiQuota();
    const t0 = 1_000_000;
    assert.equal(consumeAiQuota('o1', t0, 2).allowed, true);
    assert.equal(consumeAiQuota('o1', t0 + 1, 2).allowed, true);
    const blocked = consumeAiQuota('o1', t0 + 2, 2);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfterMs > 0);
  });
  it('slides the window and isolates keys', () => {
    resetAiQuota();
    consumeAiQuota('a', 0, 1);
    assert.equal(consumeAiQuota('a', 1, 1).allowed, false);
    assert.equal(consumeAiQuota('b', 1, 1).allowed, true);
    assert.equal(consumeAiQuota('a', 3_600_001, 1).allowed, true);
  });
});
