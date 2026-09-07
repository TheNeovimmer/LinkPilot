import { isWriteMethod, type OrgRole } from '../modules/rbac/roles';

const DOMAIN_RESOURCES = new Set([
  'companies',
  'conversations',
  'recruiters',
  'jobs',
  'applications',
  'interviews',
  'notes',
  'reminders',
  'notifications',
  'dashboard',
  'attachments',
]);

export function isDomainResource(resource: string): boolean {
  return DOMAIN_RESOURCES.has(resource);
}

/** Minimum org role for a domain call. Writes need MEMBER, reads need VIEWER. Null = no org gate. */
export function minRoleFor(resource: string, method: string): OrgRole | null {
  if (!isDomainResource(resource)) return null;
  return isWriteMethod(method) ? 'MEMBER' : 'VIEWER';
}

/** AI mutations need MEMBER; settings reads ride on the domain gate above. */
export function minRoleForAi(method: string): OrgRole | null {
  return method === 'POST' ? 'MEMBER' : null;
}
