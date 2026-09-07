export const ORG_ROLES = ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PLATFORM_ROLES = ['USER', 'SUPER_ADMIN'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

const RANK: Record<OrgRole, number> = { VIEWER: 1, MEMBER: 2, ADMIN: 3, OWNER: 4 };

export function isOrgRole(v: unknown): v is OrgRole {
  return typeof v === 'string' && (ORG_ROLES as readonly string[]).includes(v);
}

export function atLeast(role: OrgRole, min: OrgRole): boolean {
  return RANK[role] >= RANK[min];
}

export type RbacAction = 'read' | 'write' | 'invite' | 'manageMembers' | 'manageOrg' | 'viewAudit';

const MATRIX: Record<RbacAction, OrgRole> = {
  read: 'VIEWER',
  write: 'MEMBER',
  invite: 'ADMIN',
  manageMembers: 'ADMIN',
  manageOrg: 'OWNER',
  viewAudit: 'ADMIN',
};

export function can(action: RbacAction, role: OrgRole | null | undefined): boolean {
  if (!role || !isOrgRole(role)) return false;
  return atLeast(role, MATRIX[action]);
}

export function normalizeRole(role: unknown, fallback: OrgRole = 'MEMBER'): OrgRole {
  return isOrgRole(role) ? role : fallback;
}

/** Only OWNERs may grant, change, or remove other OWNERs. ADMINs manage MEMBER/VIEWER/ADMIN. */
export function canManageOwners(actor: OrgRole): boolean {
  return actor === 'OWNER';
}

/** HTTP verbs that mutate state (RBAC write gate). */
export const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

export function isWriteMethod(method: string): boolean {
  return WRITE_METHODS.has(method.toUpperCase());
}
