import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { atLeast, can, canManageOwners, isOrgRole, isWriteMethod, normalizeRole } from '../src/modules/rbac/roles';

describe('isOrgRole', () => {
  it('accepts the four org roles', () => {
    for (const r of ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']) assert.equal(isOrgRole(r), true);
  });
  it('rejects unknown, lowercase, null', () => {
    assert.equal(isOrgRole('owner'), false);
    assert.equal(isOrgRole('SUPER'), false);
    assert.equal(isOrgRole(null), false);
    assert.equal(isOrgRole(undefined), false);
  });
});

describe('atLeast', () => {
  it('ranks VIEWER < MEMBER < ADMIN < OWNER', () => {
    assert.equal(atLeast('OWNER', 'VIEWER'), true);
    assert.equal(atLeast('VIEWER', 'MEMBER'), false);
    assert.equal(atLeast('ADMIN', 'ADMIN'), true);
    assert.equal(atLeast('MEMBER', 'ADMIN'), false);
  });
});

describe('can matrix', () => {
  it('viewer reads but never writes', () => {
    assert.equal(can('read', 'VIEWER'), true);
    assert.equal(can('write', 'VIEWER'), false);
    assert.equal(can('invite', 'VIEWER'), false);
  });
  it('member writes, cannot invite or manage', () => {
    assert.equal(can('write', 'MEMBER'), true);
    assert.equal(can('invite', 'MEMBER'), false);
    assert.equal(can('manageMembers', 'MEMBER'), false);
    assert.equal(can('viewAudit', 'MEMBER'), false);
  });
  it('admin invites and audits, cannot manage org', () => {
    assert.equal(can('invite', 'ADMIN'), true);
    assert.equal(can('manageMembers', 'ADMIN'), true);
    assert.equal(can('viewAudit', 'ADMIN'), true);
    assert.equal(can('manageOrg', 'ADMIN'), false);
  });
  it('owner can do everything', () => {
    for (const a of ['read', 'write', 'invite', 'manageMembers', 'manageOrg', 'viewAudit'] as const) {
      assert.equal(can(a, 'OWNER'), true);
    }
  });
  it('null role can do nothing', () => {
    assert.equal(can('read', null), false);
    assert.equal(can('write', undefined), false);
  });
});

describe('canManageOwners', () => {
  it('only OWNER', () => {
    assert.equal(canManageOwners('OWNER'), true);
    assert.equal(canManageOwners('ADMIN'), false);
    assert.equal(canManageOwners('MEMBER'), false);
  });
});

describe('normalizeRole', () => {
  it('falls back for garbage', () => {
    assert.equal(normalizeRole('nope'), 'MEMBER');
    assert.equal(normalizeRole(null, 'VIEWER'), 'VIEWER');
    assert.equal(normalizeRole('ADMIN'), 'ADMIN');
  });
});

describe('isWriteMethod', () => {
  it('classifies verbs case-insensitively', () => {
    assert.equal(isWriteMethod('POST'), true);
    assert.equal(isWriteMethod('patch'), true);
    assert.equal(isWriteMethod('GET'), false);
  });
});
