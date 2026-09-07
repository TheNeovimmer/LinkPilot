'use client';

import { useState } from 'react';
import { CalendarClock, Check, FileDown, LayoutDashboard, Send, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PreviewKind = 'funnel' | 'draft' | 'calendar' | 'offer';

const TABS: { id: string; label: string; icon: typeof Send; title: string; body: string; bullets: string[]; preview: PreviewKind }[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    title: 'See the search, not just the list.',
    body: 'Funnel, response rate, reply time, and open offers update live as you log activity.',
    bullets: ['Application funnel by stage', 'Response rate and reply time', 'Due reminders in one strip'],
    preview: 'funnel',
  },
  {
    id: 'drafts',
    label: 'AI drafts',
    icon: Send,
    title: 'Replies drafted from real context.',
    body: 'The thread, the job, and your goals go in. A reply in your tone comes out.',
    bullets: ['Tone matched to your profile', 'Rewrite for clarity or length', 'Thread summaries on demand'],
    preview: 'draft',
  },
  {
    id: 'interviews',
    label: 'Interviews',
    icon: CalendarClock,
    title: 'Walk in prepared, on time.',
    body: 'Topics, likely questions, and tips per interview, plus calendar export with reminders.',
    bullets: ['Prep generated per role', 'One-click .ics export', 'Built-in reminders'],
    preview: 'calendar',
  },
  {
    id: 'offers',
    label: 'Offers',
    icon: FileDown,
    title: 'Compare offers like numbers.',
    body: 'Compensation, currency, frequency, and negotiation status tracked per application.',
    bullets: ['Amount, currency, frequency', 'Negotiation status', 'Open offers on dashboard'],
    preview: 'offer',
  },
];

function Preview({ kind }: { kind: PreviewKind }) {
  if (kind === 'funnel') {
    return (
      <div className="flex h-36 items-end gap-1.5" aria-hidden="true">
        {[30, 48, 62, 44, 74, 58, 90, 66, 82, 56].map((h, i) => (
          <span key={i} style={{ height: `${h}%` }} className="flex-1 rounded-sm bg-accent/55" />
        ))}
      </div>
    );
  }
  if (kind === 'draft') {
    return (
      <div className="flex flex-col gap-2.5" aria-hidden="true">
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-accent">
          <Sparkles className="h-3 w-3" strokeWidth={2} />
          AI DRAFT READY
        </p>
        <div className="h-2.5 w-full rounded-full bg-surface-3" />
        <div className="h-2.5 w-11/12 rounded-full bg-surface-3" />
        <div className="h-2.5 w-4/12 rounded-full bg-accent/50" />
      </div>
    );
  }
  if (kind === 'calendar') {
    return (
      <div className="grid grid-cols-7 gap-1.5" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'flex h-9 items-center justify-center rounded-[6px] border font-mono text-[10px]',
              i === 9 ? 'border-accent-border bg-accent-muted text-accent' : 'border-border bg-surface text-text-muted',
            )}
          >
            {i + 3}
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      {[
        ['Senior Frontend', '132k yearly', true],
        ['Fullstack Engineer', '118k yearly', false],
      ].map(([role, comp, hl]) => (
        <div
          key={String(role)}
          className={cn(
            'flex items-center justify-between rounded-[var(--radius-card)] border px-3 py-2.5',
            hl ? 'border-accent-border bg-accent-muted' : 'border-border bg-surface',
          )}
        >
          <span className="text-[12.5px] font-medium">{role}</span>
          <span className="font-mono text-[11.5px] text-text-secondary">{comp}</span>
        </div>
      ))}
    </div>
  );
}

export function ProductTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];
  return (
    <div>
      <div role="tablist" aria-label="Product tour" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              id={`tab-${t.id}`}
              onClick={() => setActive(t.id)}
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-control)] border px-3.5 py-2 text-[13px] font-medium transition-colors',
                selected
                  ? 'border-accent-border bg-accent-muted text-text'
                  : 'border-border bg-surface text-text-secondary hover:border-border-strong hover:text-text',
              )}
            >
              <t.icon className={cn('h-4 w-4', selected ? 'text-accent' : 'text-text-muted')} strokeWidth={1.75} />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div role="tabpanel" id={`panel-${tab.id}`} aria-labelledby={`tab-${tab.id}`} className="rounded-[var(--radius-card)] border border-border bg-surface p-6">
          <h3 className="text-xl font-semibold tracking-tight text-balance">{tab.title}</h3>
          <p className="mt-2 max-w-[52ch] text-[14px] leading-relaxed text-text-secondary">{tab.body}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {tab.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-[13.5px] text-text-secondary">
                <Check className="h-4 w-4 shrink-0 text-accent" strokeWidth={2} />
                {b}
              </li>
            ))}
          </ul>
        </div>
        <Card className="bg-surface-2">
          <CardContent className="p-6">
            <Preview kind={tab.preview} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
