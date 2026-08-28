'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import type { AuditLogEntry } from '@/types';

interface AuditResponse {
  items: AuditLogEntry[];
  meta: { page: number; totalPages: number; total: number };
}

const ACTIONS = [
  'conversation.create',
  'conversation.update',
  'conversation.delete',
  'message.create',
  'message.delete',
  'recruiter.create',
  'recruiter.update',
  'recruiter.delete',
  'company.create',
  'company.update',
  'company.delete',
  'job.create',
  'job.update',
  'job.delete',
  'job.analyze',
  'application.create',
  'application.update',
  'application.delete',
  'interview.create',
  'interview.update',
  'interview.delete',
  'interview.prep',
  'interview.reminder',
  'note.create',
  'note.update',
  'note.delete',
  'reminder.create',
  'reminder.update',
  'reminder.delete',
  'reminder.due',
  'profile.update',
  'ai.draft',
  'ai.summarize',
];

const ENTITIES = ['conversation', 'message', 'recruiter', 'company', 'job', 'application', 'interview', 'note', 'reminder', 'profile'];

const ACTION_COLORS: Record<string, string> = {
  create: 'text-accent bg-accent/10 ring-accent-border',
  update: 'text-sky-300 bg-sky-400/10 ring-sky-400/30',
  delete: 'text-red-300 bg-red-400/10 ring-red-400/30',
  analyze: 'text-accent bg-accent/10 ring-accent-border',
  prep: 'text-accent bg-accent/10 ring-accent-border',
  draft: 'text-accent bg-accent/10 ring-accent-border',
  summarize: 'text-accent bg-accent/10 ring-accent-border',
  due: 'text-amber-300 bg-amber-400/10 ring-amber-400/30',
  reminder: 'text-amber-300 bg-amber-400/10 ring-amber-400/30',
};

function actionTone(action: string): string {
  for (const [key, cls] of Object.entries(ACTION_COLORS)) {
    if (action.includes(key)) return cls;
  }
  return 'text-text-secondary bg-surface-3 ring-border-strong';
}

export function ActivityPage() {
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['audit', action, entity, page],
    queryFn: async () => {
      const res = await api.get('/audit-logs', {
        params: { limit: 25, page, action: action || undefined, entity: entity || undefined },
      });
      return { items: res.data.data as AuditLogEntry[], meta: res.data.meta as AuditResponse['meta'] };
    },
  });

  const actions = data?.items ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Activity"
        description="An immutable log of everything LinkPilot has done for you."
        actions={
          <Button variant="secondary" onClick={() => setPage(1)} disabled={!isFetching && page === 1}>
            <RefreshCw className={cn('h-3.5 w-3.5', isFetching && 'animate-spin')} strokeWidth={1.75} />
            Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-[12.5px] text-text focus:border-accent-border focus:outline-none"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={entity}
          onChange={(e) => { setEntity(e.target.value); setPage(1); }}
          className="h-9 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-[12.5px] text-text focus:border-accent-border focus:outline-none"
        >
          <option value="">All entities</option>
          {ENTITIES.map((en) => (
            <option key={en} value={en}>
              {en}
            </option>
          ))}
        </select>
        <span className="ml-auto font-mono text-[11px] text-text-muted">
          {meta ? `${meta.total} entries` : ''}
        </span>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-[#0c0c0f]">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-[var(--radius-control)]" />
            ))}
          </div>
        ) : actions.length ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-muted">
                <th className="px-4 py-2.5 font-medium">Action</th>
                <th className="px-4 py-2.5 font-medium">Entity</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Details</th>
                <th className="px-4 py-2.5 text-right font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 text-[13px] transition-colors last:border-0 hover:bg-surface-2/40">
                  <td className="px-4 py-2.5">
                    <Badge className={cn('font-mono text-[11px]', actionTone(entry.action))}>{entry.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[12px] text-text-secondary">
                    {entry.entity ?? '—'}
                    {entry.entityId ? <span className="text-text-muted"> · {entry.entityId.slice(0, 12)}…</span> : null}
                  </td>
                  <td className="hidden max-w-[280px] truncate px-4 py-2.5 text-[12px] text-text-muted sm:table-cell">
                    {entry.meta ? Object.entries(entry.meta).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' · ') : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-[12px] text-text-muted">{formatDateTime(entry.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState
            icon={History}
            title={action || entity ? 'No matching activity' : 'No activity yet'}
            description={action || entity ? 'Try different filters.' : 'Actions you take across the app will show up here.'}
          />
        )}
      </div>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="font-mono text-[12px] text-text-muted">
            {meta.page} / {meta.totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
