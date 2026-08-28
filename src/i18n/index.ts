import type { Locale, Messages } from './types';
import { messages as en } from './messages/en';
import { messages as fr } from './messages/fr';
import { messages as ar } from './messages/ar';

export { LOCALES, DEFAULT_LOCALE } from './types';
export type { Locale } from './types';

const DICTS: Record<Locale, Messages> = { en, fr, ar };

export const SOURCE: Messages = en;

export function getDict(locale: Locale): Messages {
  return DICTS[locale] ?? en;
}

/**
 * Format a template string replacing {key} placeholders with values.
 * e.g. t('dashboard.welcomeName', { name: 'Amine' })
 */
export function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    values[key] !== undefined ? String(values[key]) : `{${key}}`,
  );
}
