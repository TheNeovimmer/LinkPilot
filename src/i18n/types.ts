export type Locale = 'en' | 'fr' | 'ar';

export const LOCALES: { code: Locale; label: string; flag: string; dir: 'ltr' | 'rtl'; locale: string }[] = [
  { code: 'en', label: 'English', flag: 'EN', dir: 'ltr', locale: 'en-US' },
  { code: 'fr', label: 'French', flag: 'FR', dir: 'ltr', locale: 'fr-TN' },
  { code: 'ar', label: 'Arabic', flag: 'AR', dir: 'rtl', locale: 'ar-TN' },
];

export const DEFAULT_LOCALE: Locale = 'en';

/**
 * Flat translation dictionary. Root locale files re-export { messages }.
 * Keys are dot-nested strings; missing keys fall back to the source (en).
 */
export type Messages = Record<string, string>;
