import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, MessageSquare, Search, StickyNote, Users, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useUI } from '@/stores/ui';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import type { Conversation, Job, Note, Recruiter } from '@/types';

interface PaletteItem {
  id: string;
  kind: 'conversation' | 'job' | 'recruiter' | 'note' | 'action';
  title: string;
  subtitle?: string;
  to?: string;
  action?: () => void;
}

const QUICK_ACTIONS = [
  { id: 'a-new-conv', kind: 'action' as const, title: 'New conversation', to: '/conversations?new=1' },
  { id: 'a-new-job', kind: 'action' as const, title: 'Add a job', to: '/jobs?new=1' },
  { id: 'a-new-note', kind: 'action' as const, title: 'New note', to: '/notes?new=1' },
  { id: 'a-new-reminder', kind: 'action' as const, title: 'New reminder', to: '/reminders?new=1' },
];

const KIND_ICON = {
  conversation: MessageSquare,
  job: Briefcase,
  recruiter: Users,
  note: StickyNote,
  action: Plus,
};

export function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPaletteOpen);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data: conversations } = useQuery({
    queryKey: ['palette', 'conversations'],
    queryFn: async () => (await api.get('/conversations', { params: { limit: 5 } })).data.data as Conversation[],
    enabled: open,
  });
  const { data: jobs } = useQuery({
    queryKey: ['palette', 'jobs'],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 5 } })).data.data as Job[],
    enabled: open,
  });
  const { data: recruiters } = useQuery({
    queryKey: ['palette', 'recruiters'],
    queryFn: async () => (await api.get('/recruiters', { params: { limit: 5 } })).data.data as Recruiter[],
    enabled: open,
  });
  const { data: notes } = useQuery({
    queryKey: ['palette', 'notes'],
    queryFn: async () => (await api.get('/notes', { params: { limit: 5 } })).data.data as Note[],
    enabled: open,
  });

  // Cmd/Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();
    const pick = <T,>(rows: T[] | undefined) => rows ?? [];
    const all: PaletteItem[] = [
      ...pick(conversations).map((c) => ({
        id: c.id,
        kind: 'conversation' as const,
        title: c.contactName,
        subtitle: `${c.companyName ?? 'Contact'} · ${c.messageCount} messages`,
        to: `/conversations/${c.id}`,
      })),
      ...pick(jobs).map((j) => ({
        id: j.id,
        kind: 'job' as const,
        title: j.title,
        subtitle: `${j.companyName ?? 'Company'} · ${j.status}`,
        to: `/jobs/${j.id}`,
      })),
      ...pick(recruiters).map((r) => ({
        id: r.id,
        kind: 'recruiter' as const,
        title: r.name,
        subtitle: `${r.companyName ?? ''} · ${r.title ?? ''}`.trim() || 'Recruiter',
        to: `/recruiters/${r.id}`,
      })),
      ...pick(notes).map((n) => ({
        id: n.id,
        kind: 'note' as const,
        title: n.title,
        subtitle: timeAgo(n.updatedAt),
        to: `/notes/${n.id}`,
      })),
      ...QUICK_ACTIONS,
    ];
    if (!q) return all.slice(0, 12);
    return all.filter((i) => i.title.toLowerCase().includes(q) || (i.subtitle ?? '').toLowerCase().includes(q)).slice(0, 12);
  }, [query, conversations, jobs, recruiters, notes]);

  if (!open) return null;

  const go = (item: PaletteItem) => {
    setOpen(false);
    if (item.action) item.action();
    else if (item.to) navigate(item.to);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[16vh] backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-overlay)] border border-border-strong bg-surface shadow-2xl shadow-black/60 animate-in fade-in-0 zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, jobs, recruiters…"
            className="h-12 w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
          />
          <Kbd>esc</Kbd>
        </div>
        <div className="max-h-[320px] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-[13px] text-text-muted">No results for “{query}”</p>
          ) : (
            items.map((item) => {
              const Icon = KIND_ICON[item.kind];
              return (
                <button
                  key={`${item.kind}-${item.id}`}
                  onClick={() => go(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-left transition-colors hover:bg-surface-2 cursor-pointer',
                  )}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-surface-2 ring-1 ring-border">
                    <Icon className="h-3.5 w-3.5 text-text-secondary" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-text">{item.title}</p>
                    {item.subtitle ? <p className="truncate text-[11.5px] text-text-muted">{item.subtitle}</p> : null}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
