import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkInvite, checkRemove, checkRoleChange, isInviteExpired } from '../src/modules/organizations/policy';

describe('checkRoleChange', () => {
  it('member cannot change roles', () => {
    assert.equal(checkRoleChange({ actor: 'MEMBER', targetCurrent: 'MEMBER', targetNext: 'VIEWER', otherOwners: 1 }), 'insufficient_role');
  });
  it('admin cannot touch owners', () => {
    assert.equal(checkRoleChange({ actor: 'ADMIN', targetCurrent: 'OWNER', targetNext: 'MEMBER', otherOwners: 2 }), 'forbidden_owner_only');
    assert.equal(checkRoleChange({ actor: 'ADMIN', targetCurrent: 'MEMBER', targetNext: 'OWNER', otherOwners: 1 }), 'forbidden_owner_only');
  });
  it('owner cannot demote the last owner', () => {
    assert.equal(checkRoleChange({ actor: 'OWNER', targetCurrent: 'OWNER', targetNext: 'ADMIN', otherOwners: 0 }), 'last_owner');
  });
  it('owner can rotate owners when others exist', () => {
    assert.equal(checkRoleChange({ actor: 'OWNER', targetCurrent: 'OWNER', targetNext: 'ADMIN', otherOwners: 1 }), null);
    assert.equal(checkRoleChange({ actor: 'OWNER', targetCurrent: 'MEMBER', targetNext: 'OWNER', otherOwners: 1 }), null);
  });
  it('admin can manage member/viewer/admin', () => {
    assert.equal(checkRoleChange({ actor: 'ADMIN', targetCurrent: 'MEMBER', targetNext: 'VIEWER', otherOwners: 1 }), null);
    assert.equal(checkRoleChange({ actor: 'ADMIN', targetCurrent: 'MEMBER', targetNext: 'ADMIN', otherOwners: 1 }), null);
  });
});

describe('checkRemove', () => {
  it('non-admin cannot remove others', () => {
    assert.equal(checkRemove({ actor: 'MEMBER', isSelf: false, targetCurrent: 'MEMBER', otherOwners: 1 }), 'insufficient_role');
  });
  it('admin cannot remove an owner', () => {
    assert.equal(checkRemove({ actor: 'ADMIN', isSelf: false, targetCurrent: 'OWNER', otherOwners: 2 }), 'forbidden_owner_only');
  });
  it('last owner cannot leave', () => {
    assert.equal(checkRemove({ actor: 'OWNER', isSelf: true, targetCurrent: 'OWNER', otherOwners: 0 }), 'last_owner');
  });
  it('member can leave, admin can remove member', () => {
    assert.equal(checkRemove({ actor: 'MEMBER', isSelf: true, targetCurrent: 'MEMBER', otherOwners: 1 }), null);
    assert.equal(checkRemove({ actor: 'ADMIN', isSelf: false, targetCurrent: 'MEMBER', otherOwners: 1 }), null);
  });
});

describe('checkInvite', () => {
  it('member and viewer cannot invite', () => {
    assert.equal(checkInvite('MEMBER', 'MEMBER'), 'insufficient_role');
    assert.equal(checkInvite('VIEWER', 'VIEWER'), 'insufficient_role');
  });
  it('admin cannot invite owners', () => {
    assert.equal(checkInvite('ADMIN', 'OWNER'), 'forbidden_owner_only');
    assert.equal(checkInvite('ADMIN', 'ADMIN'), null);
  });
  it('owner can invite anyone', () => {
    assert.equal(checkInvite('OWNER', 'OWNER'), null);
  });
});

describe('isInviteExpired', () => {
  it('flags past dates', () => {
    assert.equal(isInviteExpired(new Date(Date.now() - 1000)), true);
    assert.equal(isInviteExpired(new Date(Date.now() + 60000)), false);
  });
});
