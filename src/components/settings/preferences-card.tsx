'use client';

import { Check, Languages, Moon, Sun, Monitor, Coins } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/stores/locale';
import { useTheme, type ThemePreference } from '@/stores/theme';
import { usePreferences } from '@/stores/preferences';
import { LOCALES } from '@/i18n';
import type { Locale } from '@/i18n';
import { CURRENCIES } from '@/constants/tunisia';
import { cn } from '@/lib/utils';

function Option<T extends string>({
  value,
  label,
  selected,
  onSelect,
  icon: Icon,
}: {
  value: T;
  label: string;
  selected: boolean;
  onSelect: (v: T) => void;
  icon?: typeof Sun;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        'flex h-9 items-center gap-2 rounded-[var(--radius-control)] border px-3 text-[13px] font-medium transition-colors cursor-pointer',
        selected
          ? 'border-accent-border bg-accent-muted text-text'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-2',
      )}
      aria-pressed={selected}
    >
      {Icon && <Icon className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.75} />}
      {label}
      {selected && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />}
    </button>
  );
}

export function PreferencesCard() {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const t = useLocale((s) => s.t);

  const preference = useTheme((s) => s.preference);
  const setPreference = useTheme((s) => s.setPreference);

  const currency = usePreferences((s) => s.currency);
  const setCurrency = usePreferences((s) => s.setCurrency);

  const themes: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: t('settings.theme.dark'), icon: Moon },
    { value: 'light', label: t('settings.theme.light'), icon: Sun },
    { value: 'system', label: t('settings.theme.system'), icon: Monitor },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/12 ring-1 ring-accent-border">
            <Languages className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          </span>
          {t('settings.preferences')}
        </CardTitle>
        <CardDescription>{t('settings.general.desc')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-text-secondary">{t('settings.language')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {LOCALES.map(({ code, label, flag }) => (
              <Option key={code} value={code as Locale} label={`${flag} · ${label}`} selected={locale === code} onSelect={setLocale} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-text-secondary">{t('settings.theme')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {themes.map(({ value, label, icon }) => (
              <Option key={value} value={value} label={label} icon={icon} selected={preference === value} onSelect={setPreference} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-medium text-text-secondary">{t('settings.currency')}</span>
          <div className="flex flex-wrap items-center gap-2">
            {CURRENCIES.map(({ value, labelKey }) => (
              <Option key={value} value={value} label={t(labelKey)} icon={Coins} selected={currency === value} onSelect={setCurrency} />
            ))}
          </div>
          <span className="text-[11.5px] text-text-muted">{t('settings.currency.desc')}</span>
        </div>
      </CardContent>
    </Card>
  );
}
