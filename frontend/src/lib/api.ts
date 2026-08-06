import axios from 'axios';

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
}

export async function getSession(): Promise<SessionUser | null> {
  const res = await fetch('/api/v1/auth/session', { credentials: 'include' });
  const json = (await res.json()) as { success: boolean; data: { user: SessionUser } | null };
  return json.success ? (json.data?.user ?? null) : null;
}

export async function signIn(email: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/sign-in/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? 'Sign-in failed');
  }
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
