'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { CalendarClock, CalendarPlus, Check, Clock, Plus, Sparkles, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { buildICS, downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { InterviewFormDialog } from '@/components/interviews/interview-form';
import { InterviewPrepDialog } from '@/components/interviews/interview-prep';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import type { Interview } from '@/types';

const MODE_META: Record<string, { label: string; className: string }> = {
  PHONE: { label: 'Phone', className: 'bg-info-muted text-info' },
  VIDEO: { label: 'Video', className: 'bg-accent-muted text-accent' },
  ONSITE: { label: 'Onsite', className: 'bg-violet-muted text-violet' },
  TECHNICAL: { label: 'Technical', className: 'bg-warning-muted text-warning' },
};

export function InterviewsPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'SCHEDULED' | 'COMPLETED'>('SCHEDULED');
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Interview | null>(null);
  const [prep, setPrep] = useState<Interview | null>(null);
  const [deleting, setDeleting] = useState<Interview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', tab],
    queryFn: async () =>
      (await api.get('/interviews', { params: { limit: 100, status: tab, sortBy: 'scheduledAt', order: tab === 'SCHEDULED' ? 'asc' : 'desc' } })).data.data as Interview[],
  });

  const complete = useMutation({
    mutationFn: async (id: string) => api.patch(`/interviews/${id}`, { status: 'COMPLETED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Marked as completed');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/interviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Interview deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const now = Date.now();

  const exportIcs = (interview: Interview) => {
    const start = new Date(interview.scheduledAt);
    const end = new Date(start.getTime() + (interview.durationMin ?? 45) * 60_000);
    downloadBlob(
      `interview-${interview.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`,
      buildICS({
        uid: `interview-${interview.id}@linkpilot`,
        summary: `Interview: ${interview.title}`,
        description: interview.feedback || `Interview scheduled in LinkPilot${interview.companyName ? ` at ${interview.companyName}` : ''}`,
        location: interview.location ?? undefined,
        start,
        end,
      }),
      'text/calendar;charset=utf-8',
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Interviews"
        description="Everything scheduled, with AI prep for each round."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Schedule interview
          </Button>
        }
      />

      <div className="flex gap-1">
        {(['SCHEDULED', 'COMPLETED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer',
              tab === t ? 'border-accent-border bg-accent-muted text-accent' : 'border-border text-text-muted hover:text-text-secondary',
            )}
          >
            {t === 'SCHEDULED' ? 'Upcoming' : 'Completed'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="space-y-2">
          {data.map((interview) => {
            const meta = MODE_META[interview.mode] ?? MODE_META.VIDEO;
            const upcoming = tab === 'SCHEDULED' && new Date(interview.scheduledAt).getTime() > now;
            return (
              <div key={interview.id} className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong">
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ring-1 ring-border',
                    upcoming ? 'bg-accent-muted' : 'bg-surface-2',
                  )}
                >
                  {upcoming ? <Clock className="h-4 w-4 text-accent" strokeWidth={1.75} /> : <Check className="h-4 w-4 text-text-muted" strokeWidth={1.75} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13.5px] font-medium text-text">{interview.title}</p>
                    <Badge className={cn('font-mono text-[10px] uppercase tracking-wide', meta.className)}>{meta.label}</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                    {formatDateTime(interview.scheduledAt)} · {interview.durationMin} min · {[interview.jobTitle, interview.recruiterName].filter(Boolean).join(' · ') || 'No job linked'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {tab === 'SCHEDULED' ? (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => setPrep(interview)}>
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                        AI prep
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => exportIcs(interview)} title="Add to calendar (.ics)">
                        <CalendarPlus className="h-3.5 w-3.5 text-text-secondary" strokeWidth={1.75} />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => complete.mutate(interview.id)} title="Mark completed">
                        <Check className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
                      </Button>
                    </>
                  ) : null}
                  <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(interview); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(interview)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CalendarClock}
          title={tab === 'SCHEDULED' ? 'Nothing scheduled' : 'No completed interviews'}
          description={tab === 'SCHEDULED' ? 'Schedule an interview and LinkPilot will prep you for it.' : 'Completed interviews land here.'}
          action={
            tab === 'SCHEDULED' ? (
              <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Schedule one
              </Button>
            ) : undefined
          }
        />
      )}

      <InterviewFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} interview={editing} />
      {prep ? <InterviewPrepDialog interview={prep} onOpenChange={(v) => !v && setPrep(null)} /> : null}
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete interview?"
          description="This removes the interview from your calendar."
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
