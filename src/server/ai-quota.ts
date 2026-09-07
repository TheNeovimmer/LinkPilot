/** Per-workspace AI usage quota: sliding window, in-memory per-process.
 * Same single-instance caveat as the realtime registry (see realtime.ts).
 * Personal scope (no org) is keyed per user so single-user setups keep working.
 */

const WINDOW_MS = 3_600_000;
const windows = new Map<string, number[]>();

export function aiQuotaKey(scope: { userId: string; orgId: string }): string {
  return scope.orgId || `user:${scope.userId}`;
}

export function consumeAiQuota(key: string, now = Date.now(), limit = aiQuotaDefault()): { allowed: boolean; retryAfterMs: number } {
  const cutoff = now - WINDOW_MS;
  const hits = (windows.get(key) ?? []).filter((t) => t > cutoff);
  if (hits.length >= limit) {
    return { allowed: false, retryAfterMs: hits[0] + WINDOW_MS - now };
  }
  hits.push(now);
  windows.set(key, hits);
  return { allowed: true, retryAfterMs: 0 };
}

function aiQuotaDefault(): number {
  const v = Number(process.env.AI_RATE_LIMIT_PER_HOUR ?? 60);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 60;
}

/** Test-only reset for the in-memory windows. */
export function resetAiQuota(): void {
  windows.clear();
}
