/** Workspace data scope. orgId comes from requireOrg; userId from the session. */
export interface DataScope {
  userId: string;
  orgId: string;
}

/** Accept legacy userId strings during rollout; empty orgId matches personal rows only. */
export type ScopeInput = string | DataScope;

export function normalizeScope(input: ScopeInput): DataScope {
  return typeof input === 'string' ? { userId: input, orgId: '' } : input;
}

/** Resolve workspace scope: SUPER_ADMIN bypasses membership but still prefers header/query org. */
export async function resolveDataScope(req: Request, user: { id: string }): Promise<DataScope> {
  const { prisma } = await import('../database/prisma');
  const me = await prisma.user.findUnique({ where: { id: user.id }, select: { platformRole: true } });
  const header = req.headers.get('x-org-id');
  const query = new URL(req.url).searchParams.get('orgId');
  const hint = header || query;
  if (me?.platformRole === 'SUPER_ADMIN') {
    if (hint) return { userId: user.id, orgId: hint };
    const { organizationService } = await import('../modules/organizations/service');
    const orgs = await organizationService.listForUser(user.id).catch(() => []);
    return { userId: user.id, orgId: orgs[0]?.id ?? '' };
  }
  const { requireOrg } = await import('./http');
  const ctx = await requireOrg(req, user as never, undefined);
  return { userId: user.id, orgId: ctx.orgId };
}

/** Read filter: org rows shared by the workspace plus legacy pre-RBAC rows (orgId null) owned by the caller. Empty orgId means personal rows only. */
export function scopeReadWhere(scope: DataScope) {
  if (!scope.orgId) return { orgId: null, userId: scope.userId };
  return { OR: [{ orgId: scope.orgId }, { orgId: null, userId: scope.userId }] };
}

/** AND-combine scope with extra filters so query args keep working. */
export function scopeAndWhere(scope: DataScope, extra: object = {}) {
  return { AND: [scopeReadWhere(scope), extra] };
}

/** Single-row guard: id plus the read filter. */
export function scopeIdWhere(scope: DataScope, id: string) {
  return { id, AND: [scopeReadWhere(scope)] };
}

/** Dual-write both columns so old userId-only code keeps working during rollout. */
export function scopeCreateData(scope: DataScope) {
  return { userId: scope.userId, orgId: scope.orgId };
}
