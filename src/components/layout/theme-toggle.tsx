'use client';

import { Moon, Sun, Monitor, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type ThemePreference } from '@/stores/theme';
import { useLocale } from '@/stores/locale';
import { cn } from '@/lib/utils';

const CURRENT_ICON: Record<ThemePreference, typeof Sun> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

export function ThemeToggle() {
  const preference = useTheme((s) => s.preference);
  const theme = useTheme((s) => s.theme);
  const setPreference = useTheme((s) => s.setPreference);
  const t = useLocale((s) => s.t);

  const CurrentIcon = CURRENT_ICON[preference];
  const shown = preference === 'system' ? theme : preference;

  const options: { value: ThemePreference; icon: typeof Sun; label: string }[] = [
    { value: 'dark', icon: Moon, label: t('user.theme.dark') },
    { value: 'light', icon: Sun, label: t('user.theme.light') },
    { value: 'system', icon: Monitor, label: t('user.theme.system') },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          data-testid="theme-toggle"
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted transition-colors hover:bg-surface-2 hover:text-text cursor-pointer"
          aria-label={t('user.theme')}
          title={t('user.theme')}
        >
          <CurrentIcon className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wide text-text-muted">
          {t('user.theme')}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map(({ value, icon: Icon, label }) => (
          <DropdownMenuItem key={value} onClick={() => setPreference(value)}>
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="flex-1">{label}</span>
            {shown === value && <Check className="h-3.5 w-3.5 text-accent" strokeWidth={2.5} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
