import { create } from 'zustand';

export type Theme = 'dark' | 'light';
export type ThemePreference = Theme | 'system';

const STORAGE_KEY = 'lp-theme';
const HTML = () => (typeof document !== 'undefined' ? document.documentElement : null);

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/** Resolve the effective theme for a stored preference (no side effects). */
export function resolveTheme(pref: ThemePreference): Theme {
  return pref === 'system' ? systemTheme() : pref;
}

/** Apply the resolved theme to <html>. Reads directly from the store. */
function apply(): void {
  const { theme } = useTheme.getState();
  const html = HTML();
  if (!html) return;
  html.setAttribute('data-theme', theme);
  html.style.colorScheme = theme;
}

interface ThemeState {
  preference: ThemePreference;
  /** The currently applied theme. */
  theme: Theme;
  init: () => void;
  setPreference: (pref: ThemePreference) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  preference: 'dark',
  theme: 'dark',

  init: () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      const pref: ThemePreference = raw === 'light' || raw === 'dark' || raw === 'system' ? raw : 'dark';
      set({ preference: pref, theme: resolveTheme(pref) });
    } catch {
      /* localStorage unavailable — fall back to defaults */
    }
    apply();
  },

  setPreference: (pref) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* ignore quota / privacy errors */
    }
    set({ preference: pref, theme: resolveTheme(pref) });
    apply();
  },
}));

/**
 * Synchronously apply the persisted/system theme before first paint, to avoid a
 * flash of the wrong theme. Inlined into <head>. Safe to call on the server.
 */
export function themeScript(): string {
  return `(function(){try{var p=localStorage.getItem('lp-theme');var t=p==='light'||p==='dark'?p:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');var h=document.documentElement;h.setAttribute('data-theme',t);h.style.colorScheme=t}catch(e){}})();`;
}
