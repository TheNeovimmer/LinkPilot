'use client';

import { Languages, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/stores/locale';
import { LOCALES } from '@/i18n';
import type { Locale } from '@/i18n';

export function LanguageSwitcher() {
  const locale = useLocale((s) => s.locale);
  const setLocale = useLocale((s) => s.setLocale);
  const t = useLocale((s) => s.t);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="lang-switcher"
          className="flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-[var(--radius-control)] px-1.5 text-text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"
          aria-label={t('user.language')}
          title={t('user.language')}
        >
          <Languages className="h-4 w-4" strokeWidth={1.75} />
          <span className="font-mono text-[10px] font-semibold uppercase">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-text-muted">
          {t('user.language')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map(({ code, label, flag }) => (
          <DropdownMenuItem key={code} onClick={() => setLocale(code as Locale)}>
            <span className="flex h-5 w-7 items-center justify-center rounded bg-surface-2 font-mono text-[9px] font-bold text-text-secondary">
              {flag}
            </span>
            <span className="flex-1">{label}</span>
            {locale === code && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
