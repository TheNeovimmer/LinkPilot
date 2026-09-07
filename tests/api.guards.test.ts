import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isDomainResource, minRoleFor, minRoleForAi } from '../src/server/guards';

describe('isDomainResource', () => {
  it('covers the eleven user-data resources', () => {
    for (const r of ['companies', 'conversations', 'recruiters', 'jobs', 'applications', 'interviews', 'notes', 'reminders', 'notifications', 'dashboard', 'attachments']) {
      assert.equal(isDomainResource(r), true);
    }
  });
  it('leaves org, admin, auth, users, ai, audit-logs ungated here', () => {
    for (const r of ['organizations', 'admin', 'auth', 'users', 'ai', 'audit-logs']) {
      assert.equal(isDomainResource(r), false);
    }
  });
});

describe('minRoleFor', () => {
  it('reads need VIEWER', () => {
    assert.equal(minRoleFor('jobs', 'GET'), 'VIEWER');
    assert.equal(minRoleFor('dashboard', 'GET'), 'VIEWER');
  });
  it('writes need MEMBER', () => {
    for (const m of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      assert.equal(minRoleFor('jobs', m), 'MEMBER');
      assert.equal(minRoleFor('notes', m), 'MEMBER');
    }
  });
  it('non-domain returns null', () => {
    assert.equal(minRoleFor('organizations', 'GET'), null);
    assert.equal(minRoleFor('admin', 'GET'), null);
  });
});

describe('minRoleForAi', () => {
  it('POST needs MEMBER, reads ungated', () => {
    assert.equal(minRoleForAi('POST'), 'MEMBER');
    assert.equal(minRoleForAi('GET'), null);
  });
});
