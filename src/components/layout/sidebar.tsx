'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Briefcase,
  Send,
  Users,
  Building2,
  CalendarClock,
  StickyNote,
  Bell,
  History,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/stores/session';
import { useLocale } from '@/stores/locale';
import { initials } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', key: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/conversations', key: 'nav.conversations', icon: MessageSquare },
  { to: '/jobs', key: 'nav.jobs', icon: Briefcase },
  { to: '/applications', key: 'nav.applications', icon: Send },
  { to: '/recruiters', key: 'nav.recruiters', icon: Users },
  { to: '/companies', key: 'nav.companies', icon: Building2 },
  { to: '/interviews', key: 'nav.interviews', icon: CalendarClock },
  { to: '/notes', key: 'nav.notes', icon: StickyNote },
  { to: '/reminders', key: 'nav.reminders', icon: Bell },
];

const SECONDARY_NAV = [{ to: '/activity', key: 'nav.activity', icon: History }];

export function Sidebar() {
  const user = useSession((s) => s.user);
  const pathname = usePathname();
  const t = useLocale((s) => s.t);

  const isActive = (to: string) => {
    if (to === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(to);
  };

  const navClass = (active: boolean) =>
    cn(
      'group flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-[7px] text-[13px] font-medium transition-colors',
      active ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary',
    );

  const iconClass = (active: boolean) => cn('h-4 w-4', active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary');

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-chrome">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent/12 ring-1 ring-accent-border">
          <span className="font-mono text-[13px] font-bold text-accent">L</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-text">{t('brand.name')}</span>
          <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">{t('brand.tagline')}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, key, icon: Icon }) => {
          const active = isActive(to);
          return (
            <Link key={to} href={to} className={navClass(active)}>
              <Icon className={iconClass(active)} strokeWidth={1.75} />
              {t(key)}
            </Link>
          );
        })}

        {/* Secondary nav */}
        <div className="mt-4 space-y-0.5 border-t border-border/60 pt-3">
          {SECONDARY_NAV.map(({ to, key, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link key={to} href={to} className={navClass(active)}>
                <Icon className={iconClass(active)} strokeWidth={1.75} />
                {t(key)}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Settings + user */}
      <div className="border-t border-border p-3">
        <Link href="/settings" className={cn('mb-1', navClass(isActive('/settings')))}>
          <Settings className={iconClass(isActive('/settings'))} strokeWidth={1.75} />
          {t('nav.settings')}
        </Link>
        <div className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[11px] font-semibold text-text-secondary ring-1 ring-border-strong">
            {initials(user?.name ?? user?.email)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12.5px] font-medium text-text">{user?.name ?? user?.email}</p>
            <p className="truncate font-mono text-[10px] text-text-muted">{user?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
