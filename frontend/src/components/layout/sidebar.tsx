import { NavLink } from 'react-router-dom';
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
import { initials } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/conversations', label: 'Conversations', icon: MessageSquare },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/applications', label: 'Applications', icon: Send },
  { to: '/recruiters', label: 'Recruiters', icon: Users },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/interviews', label: 'Interviews', icon: CalendarClock },
  { to: '/notes', label: 'Notes', icon: StickyNote },
  { to: '/reminders', label: 'Reminders', icon: Bell },
];

const SECONDARY_NAV = [{ to: '/activity', label: 'Activity', icon: History }];

export function Sidebar() {
  const user = useSession((s) => s.user);

  return (
    <aside className="flex h-full w-[232px] shrink-0 flex-col border-r border-border bg-[#0c0c0f]">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent/12 ring-1 ring-accent-border">
          <span className="font-mono text-[13px] font-bold text-accent">L</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-semibold tracking-tight text-text">LinkPilot</span>
          <span className="mt-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">career copilot</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-[7px] text-[13px] font-medium transition-colors',
                isActive ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')}
                  strokeWidth={1.75}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}

        {/* Secondary nav */}
        <div className="mt-4 space-y-0.5 border-t border-border/60 pt-3">
          {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-[7px] text-[13px] font-medium transition-colors',
                  isActive ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')}
                    strokeWidth={1.75}
                  />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Settings + user */}
      <div className="border-t border-border p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'mb-1 flex items-center gap-2.5 rounded-[var(--radius-control)] px-2.5 py-[7px] text-[13px] font-medium transition-colors',
              isActive ? 'bg-surface-2 text-text' : 'text-text-muted hover:bg-surface-2/60 hover:text-text-secondary',
            )
          }
        >
          <Settings className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          Settings
        </NavLink>
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
