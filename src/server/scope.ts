/** Workspace data scope. orgId comes from requireOrg; userId from the session. */
export interface DataScope {
  userId: string;
  orgId: string;
}

/** Read filter: org rows shared by the workspace plus legacy pre-RBAC rows (orgId null) owned by the caller. */
export function scopeReadWhere(scope: DataScope) {
  return { OR: [{ orgId: scope.orgId }, { orgId: null, userId: scope.userId }] };
}

/** Single-row guard: id plus the read filter. */
export function scopeIdWhere(scope: DataScope, id: string) {
  return { id, OR: [{ orgId: scope.orgId }, { orgId: null, userId: scope.userId }] };
}

/** Dual-write both columns so old userId-only code keeps working during rollout. */
export function scopeCreateData(scope: DataScope) {
  return { userId: scope.userId, orgId: scope.orgId };
}
