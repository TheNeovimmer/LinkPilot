/**
 * Tunisia-specific presets: governorates and common job boards.
 * Labels are locale keys (see src/i18n/messages/*.ts), resolved at render time.
 */

export const GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Béja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabès',
  'Médenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kébili',
] as const;

/** Salary currency options offered in settings. */
export const CURRENCIES = [
  { value: 'USD', labelKey: 'common.currency.usd' },
  { value: 'TND', labelKey: 'common.currency.tnd' },
] as const;

export type SalaryCurrency = (typeof CURRENCIES)[number]['value'];
