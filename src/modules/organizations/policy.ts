import { atLeast, canManageOwners, type OrgRole } from '../rbac/roles';

export type PolicyError = 'forbidden_owner_only' | 'last_owner' | 'already_member' | 'expired' | 'insufficient_role';

export interface RoleChangeInput {
  actor: OrgRole;
  targetCurrent: OrgRole;
  targetNext: OrgRole;
  otherOwners: number;
}

/** Pure guard for role changes. Returns null when allowed, else a PolicyError code. */
export function checkRoleChange({ actor, targetCurrent, targetNext, otherOwners }: RoleChangeInput): PolicyError | null {
  if (!atLeast(actor, 'ADMIN')) return 'insufficient_role';
  const touchesOwner = targetCurrent === 'OWNER' || targetNext === 'OWNER';
  if (touchesOwner && !canManageOwners(actor)) return 'forbidden_owner_only';
  if (targetCurrent === 'OWNER' && targetNext !== 'OWNER' && otherOwners === 0) return 'last_owner';
  return null;
}

export interface RemoveInput {
  actor: OrgRole;
  isSelf: boolean;
  targetCurrent: OrgRole;
  otherOwners: number;
}

/** Pure guard for member removal / leave. */
export function checkRemove({ actor, isSelf, targetCurrent, otherOwners }: RemoveInput): PolicyError | null {
  if (!isSelf && !atLeast(actor, 'ADMIN')) return 'insufficient_role';
  if (targetCurrent === 'OWNER' && !canManageOwners(actor)) return 'forbidden_owner_only';
  if (targetCurrent === 'OWNER' && otherOwners === 0) return 'last_owner';
  return null;
}

export function checkInvite(actor: OrgRole, next: OrgRole): PolicyError | null {
  if (!atLeast(actor, 'ADMIN')) return 'insufficient_role';
  if (next === 'OWNER' && !canManageOwners(actor)) return 'forbidden_owner_only';
  return null;
}

export function isInviteExpired(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() <= now.getTime();
}
