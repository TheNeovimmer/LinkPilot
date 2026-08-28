import axios from 'axios';
import type { Attachment } from '@/types';

/** Authenticated API client for /api/v1 (Better Auth cookie rides along). */
export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status as number | undefined;
    const url = err.config?.url as string | undefined;
    // Expired/invalid session → back to login (except when already logging in).
    if (status === 401 && url && !url.includes('/auth/')) {
      window.location.assign('/login');
    }
    return Promise.reject(err);
  },
);

/** Unwrap the { success, data } envelope. */
export function unwrap<T>(res: { data: { data: T } }): T {
  return res.data.data;
}

/** Read the error message from an Axios error (envelope-aware). */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const message = err.response?.data?.error?.message;
    if (message) return message;
    if (err.code === 'ECONNABORTED') return 'Request timed out';
    return err.response ? `Request failed (${err.response.status})` : 'Network error';
  }
  return err instanceof Error ? err.message : fallback;
}

// ---------------------------------------------------------------------------
// Auth (Better Auth endpoints live at /api/auth, outside the v1 baseURL)
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  twoFactorEnabled?: boolean;
}

export async function getSession(): Promise<SessionUser | null> {
  const res = await fetch('/api/v1/auth/session', { credentials: 'include' });
  const json = (await res.json()) as { success: boolean; data: { user: SessionUser } | null };
  return json.success ? (json.data?.user ?? null) : null;
}

export interface SignInResult {
  /** true when the account has 2FA and a OTP/TOTP code must be sent for step two. */
  twoFactorRequired: boolean;
}

export async function signIn(email: string, password: string): Promise<SignInResult> {
  const res = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  const body = (await res.json().catch(() => null)) as {
    message?: string;
    twoFactorRedirect?: boolean;
  } | null;
  if (!res.ok) throw new Error(body?.message ?? 'Sign-in failed');
  return { twoFactorRequired: Boolean(body?.twoFactorRedirect) };
}

export async function verifyTwoFactor(code: string): Promise<void> {
  const res = await fetch('/api/auth/two-factor/verify-totp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Invalid code');
  }
}

// --- Two-factor (Settings) ---

export interface TwoFactorSetup {
  totpURI: string;
  backupCodes: string[];
}

async function authFetch(path: string, body: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`/api/auth${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) throw new Error((json?.message as string) ?? 'Request failed');
  return json ?? {};
}

/** Start TOTP setup — returns the OTP URI (for an authenticator app) + one-time backup codes. */
export async function enableTwoFactor(password: string): Promise<TwoFactorSetup> {
  const json = await authFetch('/two-factor/enable', { password, method: 'totp' });
  const data = (json.data ?? json) as { totpURI?: string; backupCodes?: string[] };
  return {
    totpURI: data.totpURI ?? '',
    backupCodes: data.backupCodes ?? [],
  };
}

/** Verify the code from the authenticator to finish enabling 2FA. */
export async function verifyTwoFactorSetup(code: string): Promise<void> {
  await authFetch('/two-factor/verify-totp', { code });
}

/** Turn 2FA off (password required). */
export async function disableTwoFactor(password: string): Promise<void> {
  await authFetch('/two-factor/disable', { password });
}

/** Generate a fresh set of backup codes. */
export async function regenerateBackupCodes(): Promise<string[]> {
  const json = await authFetch('/two-factor/regenerate-backup-codes', {});
  const data = (json.data ?? json) as { backupCodes?: string[] };
  return data.backupCodes ?? [];
}

export async function signUp(name: string, email: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/sign-up/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Sign-up failed');
  }
}

export async function signOut(): Promise<void> {
  await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
}

// ---------------------------------------------------------------------------
// AI provider settings (per-user, persisted server-side; key never exposed)
// ---------------------------------------------------------------------------

export interface AiSettingsView {
  baseUrl: string;
  model: string;
  embeddingModel: string | null;
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyHint: string | null;
}

/** Sparse patch — only fields present are saved. Empty apiKey = leave unchanged. */
export interface AiSettingsPatch {
  baseUrl?: string;
  model?: string;
  embeddingModel?: string | null;
  apiKey?: string;
  enabled?: boolean;
}

export async function getAiSettings(): Promise<AiSettingsView> {
  const res = await api.get('/ai/settings');
  return unwrap(res);
}

export async function saveAiSettings(patch: AiSettingsPatch): Promise<AiSettingsView> {
  const res = await api.put('/ai/settings', patch);
  return unwrap(res);
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function listAttachments(entity: 'application' | 'note', id: string | null): Promise<Attachment[]> {
  if (!id) return [];
  const params: Record<string, string> = entity === 'application' ? { applicationId: id } : { noteId: id };
  const res = await api.get('/attachments', { params });
  return unwrap(res);
}

export async function uploadAttachment(
  entity: 'application' | 'note',
  id: string,
  kind: string,
  file: File,
): Promise<Attachment> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('kind', kind);
  fd.append(entity === 'application' ? 'applicationId' : 'noteId', id);
  const res = await api.post('/attachments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return unwrap(res);
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete(`/attachments/${id}`);
}
