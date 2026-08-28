import { useLocale } from '@/stores/locale';
import { usePreferences } from '@/stores/preferences';

const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  fr: 'fr-TN',
  ar: 'ar-TN',
};

function intlLocale(): string {
  // Components using these helpers must be inside the LocaleProvider, so the
  // store is initialized. Fall back to navigator language if not yet ready.
  try {
    const l = useLocale.getState().locale;
    return LOCALE_MAP[l] ?? l;
  } catch {
    return 'en-US';
  }
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(intlLocale(), { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(intlLocale(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(d));
}

export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat(intlLocale(), { hour: 'numeric', minute: '2-digit' }).format(new Date(d));
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const t = useLocale.getState().t;
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t('common.timeAgo.justNow');
  if (mins < 60) return t('common.timeAgo.m', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('common.timeAgo.h', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('common.timeAgo.d', { n: days });
  return formatDate(d);
}

interface CurrencyPref {
  currency: 'TND' | 'USD';
}

function activeCurrency(): 'TND' | 'USD' {
  try {
    return usePreferences.getState().currency;
  } catch {
    return 'USD';
  }
}

export function formatCurrency(value: number | null | undefined, pref?: CurrencyPref): string {
  if (value == null) return '—';
  const currency = (pref?.currency ?? activeCurrency()) as 'TND' | 'USD';
  try {
    const nf = new Intl.NumberFormat(intlLocale(), { style: 'currency', currency, maximumFractionDigits: 0 });
    return nf.format(value);
  } catch {
    return `${value} ${currency}`;
  }
}

export function formatSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  pref?: CurrencyPref,
): string {
  const t = useLocale.getState().t;
  if (min == null && max == null) return t('common.notSpecified');
  if (min != null && max != null) return `${formatCurrency(min, pref)} – ${formatCurrency(max, pref)}`;
  if (min != null) return `${t('common.from')} ${formatCurrency(min, pref)}`;
  return `${t('common.upTo')} ${formatCurrency(max, pref)}`;
}
