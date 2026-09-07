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

/** Resolve workspace scope: SUPER_ADMIN bypasses membership but still prefers header/query org.
 * Shares the dispatch gate's per-request memo, so membership resolves once per request. */
export async function resolveDataScope(req: Request, user: { id: string }): Promise<DataScope> {
  const { isSuperAdmin, requireOrg } = await import('./http');
  const header = req.headers.get('x-org-id');
  const query = new URL(req.url).searchParams.get('orgId');
  const hint = header || query;
  if (await isSuperAdmin(req, user.id)) {
    // No auto-provisioning on the read path: without an explicit hint the
    // admin sees personal rows only (a GET must never write).
    if (hint) return { userId: user.id, orgId: hint };
    return { userId: user.id, orgId: '' };
  }
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

/** Dual-write both columns; empty orgId becomes null so legacy personal rows keep the null invariant. */
export function scopeCreateData(scope: DataScope) {
  return { userId: scope.userId, orgId: scope.orgId || null };
}
