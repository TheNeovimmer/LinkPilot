import { create } from 'zustand';
import type { SalaryCurrency } from '@/constants/tunisia';

const STORAGE_KEY = 'lp-preferences';

interface PreferencesState {
  currency: SalaryCurrency;
  init: () => void;
  setCurrency: (currency: SalaryCurrency) => void;
}

export const usePreferences = create<PreferencesState>((set, get) => ({
  currency: 'USD',

  init: () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PreferencesState>;
        if (parsed.currency === 'TND' || parsed.currency === 'USD') {
          set({ currency: parsed.currency });
        }
      }
    } catch {
      /* ignore */
    }
  },

  setCurrency: (currency) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ currency }));
    } catch {
      /* ignore */
    }
    set({ currency });
  },
}));
