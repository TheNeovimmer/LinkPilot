import { create } from 'zustand';
import { getSession, signOut as apiSignOut, type SessionUser } from '@/lib/api';

interface SessionState {
  user: SessionUser | null;
  status: 'loading' | 'authed' | 'anon';
  init: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  status: 'loading',
  init: async () => {
    try {
      const user = await getSession();
      set({ user, status: user ? 'authed' : 'anon' });
    } catch {
      set({ user: null, status: 'anon' });
    }
  },
  setUser: (user) => set({ user, status: user ? 'authed' : 'anon' }),
  logout: async () => {
    await apiSignOut();
    set({ user: null, status: 'anon' });
  },
}));
