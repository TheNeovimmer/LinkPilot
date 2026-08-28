'use client';

import { Search, Menu } from 'lucide-react';
import { useUI } from '@/stores/ui';
import { useLocale } from '@/stores/locale';
import { Kbd } from '@/components/ui/kbd';
import { NotificationsPopover } from './notifications-popover';
import { UserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';
import { LanguageSwitcher } from './language-switcher';

export function Topbar() {
  const setPaletteOpen = useUI((s) => s.setPaletteOpen);
  const setSidebarOpen = useUI((s) => s.setSidebarOpen);
  const t = useLocale((s) => s.t);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-chrome px-4">
      <button
        onClick={() => setSidebarOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-control)] text-text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden cursor-pointer"
        aria-label={t('nav.dashboard')}
      >
        <Menu className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <button
        onClick={() => setPaletteOpen(true)}
        className="group flex h-8 w-full max-w-sm items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-[13px] text-text-muted transition-colors hover:border-border-strong hover:text-text-secondary cursor-pointer"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="flex-1 text-start">{t('topbar.search')}</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <NotificationsPopover />
        <UserMenu />
      </div>
    </header>
  );
}
