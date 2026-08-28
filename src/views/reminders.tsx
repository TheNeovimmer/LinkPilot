'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { AlarmClock, Bell, Check, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { ReminderFormDialog } from '@/components/reminders/reminder-form';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import type { Reminder } from '@/types';

export function RemindersPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reminders', tab],
    queryFn: async () =>
      (await api.get('/reminders', { params: { limit: 100, done: tab === 'done' ? 'true' : 'false', sortBy: 'dueAt' } })).data.data as Reminder[],
  });

  const toggleDone = useMutation({
    mutationFn: async (r: Reminder) => api.patch(`/reminders/${r.id}`, { done: !r.done }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'count'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const snooze = useMutation({
    mutationFn: async (r: Reminder) => api.patch(`/reminders/${r.id}`, { dueAt: new Date(Date.now() + 24 * 3_600_000).toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Snoozed 24 hours');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Reminder deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const now = Date.now();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reminders"
        description="Follow-ups that keep the pipeline moving."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            New reminder
          </Button>
        }
      />

      <div className="flex gap-1">
        {(['pending', 'done'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer',
              tab === t ? 'border-accent-border bg-accent-muted text-accent' : 'border-border text-text-muted hover:text-text-secondary',
            )}
          >
            {t === 'pending' ? 'Pending' : 'Done'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[64px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="space-y-2">
          {data.map((r) => {
            const overdue = tab === 'pending' && new Date(r.dueAt).getTime() < now;
            return (
              <div key={r.id} className="flex items-center gap-3 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3">
                <button
                  onClick={() => toggleDone.mutate(r)}
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer',
                    r.done ? 'border-accent bg-accent' : 'border-border-strong hover:border-accent',
                  )}
                  title={r.done ? 'Mark pending' : 'Mark done'}
                >
                  {r.done ? <Check className="h-3 w-3 text-background" strokeWidth={2.5} /> : null}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('truncate text-[13.5px] font-medium text-text', r.done && 'line-through opacity-50')}>{r.title}</p>
                    {overdue ? <Badge variant="warning" className="font-mono text-[10px] uppercase">Overdue</Badge> : null}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-text-muted">
                    <AlarmClock className="h-3 w-3" strokeWidth={1.75} />
                    {formatDateTime(r.dueAt)}
                    {r.body ? <span className="truncate">· {r.body}</span> : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {tab === 'pending' ? (
                    <Button variant="ghost" size="icon-sm" onClick={() => snooze.mutate(r)} title="Snooze 24h">
                      <AlarmClock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(r)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Bell}
          title={tab === 'pending' ? 'No pending reminders' : 'Nothing completed yet'}
          description="Set reminders for follow-ups, deadlines, and applications to chase."
          action={
            tab === 'pending' ? (
              <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Set a reminder
              </Button>
            ) : undefined
          }
        />
      )}

      <ReminderFormDialog open={formOpen} onOpenChange={setFormOpen} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete reminder?"
          description={`This removes “${deleting.title}”.`}
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
