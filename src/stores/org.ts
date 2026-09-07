import { create } from 'zustand';
import { api, unwrap } from '@/lib/api';

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt?: string;
}

const KEY = 'linkpilot.activeOrg';

interface OrgState {
  orgs: OrgSummary[];
  activeOrgId: string | null;
  status: 'idle' | 'loading' | 'ready';
  init: () => Promise<void>;
  setActive: (id: string) => void;
  refresh: () => Promise<void>;
}

function stored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export const useOrg = create<OrgState>((set, get) => ({
  orgs: [],
  activeOrgId: stored(),
  status: 'idle',
  init: async () => {
    if (get().status === 'loading') return;
    set({ status: 'loading' });
    try {
      const res = await api.get('/organizations');
      const orgs = unwrap<OrgSummary[]>(res);
      let active = get().activeOrgId;
      if (!active || !orgs.some((o) => o.id === active)) active = orgs[0]?.id ?? null;
      try {
        if (active) localStorage.setItem(KEY, active);
      } catch {
        /* private mode */
      }
      set({ orgs, activeOrgId: active, status: 'ready' });
    } catch {
      set({ status: 'ready' });
    }
  },
  setActive: (id: string) => {
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* ignore */
    }
    set({ activeOrgId: id });
  },
  refresh: async () => {
    try {
      const res = await api.get('/organizations');
      const orgs = unwrap<OrgSummary[]>(res);
      let active = get().activeOrgId;
      if (!active || !orgs.some((o) => o.id === active)) active = orgs[0]?.id ?? null;
      set({ orgs, activeOrgId: active });
    } catch {
      /* keep old */
    }
  },
}));

export function activeOrgRole(orgs: OrgSummary[], activeId: string | null): OrgSummary['role'] | null {
  return orgs.find((o) => o.id === activeId)?.role ?? null;
}

/** Client-side write gate mirror (server still enforces). VIEWERs see read-only UI. */
export function useCanWrite(): boolean {
  const orgs = useOrg((s) => s.orgs);
  const activeId = useOrg((s) => s.activeOrgId);
  const role = activeOrgRole(orgs, activeId);
  return role === null || role === 'OWNER' || role === 'ADMIN' || role === 'MEMBER';
}

export function useCanInvite(): boolean {
  const orgs = useOrg((s) => s.orgs);
  const activeId = useOrg((s) => s.activeOrgId);
  const role = activeOrgRole(orgs, activeId);
  return role === null || role === 'OWNER' || role === 'ADMIN';
}
