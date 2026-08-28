import { create } from 'zustand';
import { DEFAULT_LOCALE, getDict, interpolate } from '@/i18n';
import type { Locale } from '@/i18n';

const STORAGE_KEY = 'lp-locale';

export type Direction = 'ltr' | 'rtl';

function dirFor(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Sync locale + dir to <html>. Reads directly from the store. */
function apply(): void {
  if (typeof document === 'undefined') return;
  const { locale } = useLocale.getState();
  const html = document.documentElement;
  html.setAttribute('lang', locale);
  html.setAttribute('dir', dirFor(locale));
}

/** Build a `t` bound to a specific locale (fresh function identity per locale). */
function makeT(locale: Locale) {
  return (key: string, values?: Record<string, string | number>): string => {
    const template = getDict(locale)[key] ?? getDict('en')[key] ?? key;
    return interpolate(template, values);
  };
}

interface LocaleState {
  locale: Locale;
  dir: Direction;
  init: () => void;
  setLocale: (locale: Locale) => void;
  /** Translate a key with optional interpolation values. Reactive to locale changes. */
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * NOTE: `t` is recreated (new reference) every time `locale` changes so that
 * components subscribed via `useLocale((s) => s.t)` re-render on switch.
 * zustand compares selectors by reference, so a fresh `t` guarantees updates.
 */
export const useLocale = create<LocaleState>((set, get) => ({
  locale: DEFAULT_LOCALE,
  dir: 'ltr',
  t: makeT(DEFAULT_LOCALE),

  init: () => {
    let locale: Locale;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      locale =
        raw === 'en' || raw === 'fr' || raw === 'ar' ? (raw as Locale) : DEFAULT_LOCALE;
    } catch {
      locale = DEFAULT_LOCALE;
    }
    set({ locale, dir: dirFor(locale), t: makeT(locale) });
    apply();
  },

  setLocale: (locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    set({ locale, dir: dirFor(locale), t: makeT(locale) });
    apply();
  },
}));

/** Sync locale + dir to <html> before first paint to avoid layout shift. */
export function localeScript(): string {
  return `(function(){try{var l=localStorage.getItem('lp-locale')||'en';var d=l==='ar'?'rtl':'ltr';var h=document.documentElement;h.setAttribute('lang',l);h.setAttribute('dir',d)}catch(e){}})();`;
}
