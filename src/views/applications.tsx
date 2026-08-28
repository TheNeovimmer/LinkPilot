'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Clock, Download, Plus, Send, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { toCSV, downloadBlob } from '@/lib/export';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { APPLICATION_STATUS_META } from '@/components/common/status-badge';
import { ApplicationFormDialog } from '@/components/applications/application-form';
import { useLocale } from '@/stores/locale';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { Application } from '@/types';

const PIPELINE: { key: string; labelKey: string }[] = [
  { key: 'DRAFT', labelKey: 'app.status.DRAFT' },
  { key: 'SUBMITTED', labelKey: 'app.status.SUBMITTED' },
  { key: 'UNDER_REVIEW', labelKey: 'app.status.UNDER_REVIEW' },
  { key: 'INTERVIEWING', labelKey: 'app.status.INTERVIEWING' },
  { key: 'OFFER', labelKey: 'app.status.OFFER' },
  { key: 'REJECTED', labelKey: 'app.status.REJECTED' },
  { key: 'WITHDRAWN', labelKey: 'app.status.WITHDRAWN' },
];

export function ApplicationsPage() {
  const t = useLocale((s) => s.t);
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);

  const { data: stats } = useQuery({
    queryKey: ['applications', 'pipeline'],
    queryFn: async () => (await api.get('/applications/pipeline')).data.data,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['applications', status],
    queryFn: async () => (await api.get('/applications', { params: { limit: 100, status: status || undefined } })).data.data as Application[],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/applications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Application deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const move = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: string }) => api.patch(`/applications/${id}`, { status: next }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const exportCsv = () => {
    if (!data?.length) return;
    const rows = data.map((a) => ({
      Company: a.companyName ?? '',
      Role: a.roleTitle ?? a.jobTitle ?? '',
      Status: a.status,
      Source: a.source ?? '',
      Applied: a.appliedAt ? new Date(a.appliedAt).toISOString().slice(0, 10) : '',
      'First response': a.firstResponseAt ? new Date(a.firstResponseAt).toISOString().slice(0, 10) : '',
      'Days waiting': a.waitingDays ?? '',
      'Offer amount': a.offerAmount ?? '',
      Currency: a.offerCurrency ?? '',
      'Offer status': a.offerStatus ?? '',
      Notes: a.notes ?? '',
    }));
    downloadBlob(`applications-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows), 'text/csv;charset=utf-8');
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Applications"
        description="Every application, tracked through the pipeline."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportCsv} disabled={!data?.length}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              Export CSV
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Log application
            </Button>
          </div>
        }
      />

      {/* Pipeline overview */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {PIPELINE.map((stage) => (
          <button
            key={stage.key}
            onClick={() => setStatus(status === stage.key ? '' : stage.key)}
            className={cn(
              'rounded-[var(--radius-control)] border px-2 py-2.5 text-center transition-colors cursor-pointer',
              status === stage.key ? 'border-accent-border bg-accent-muted' : 'border-border bg-surface hover:border-border-strong',
            )}
          >
            <p className="font-mono text-[15px] leading-none text-text">{(stats?.byStatus?.[stage.key] as number) ?? 0}</p>
            <p className="mt-1 truncate text-[10.5px] text-text-muted">{t(stage.labelKey)}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[56px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border">
          <div className="divide-y divide-border/60 bg-surface">
            {data.map((app) => (
              <div key={app.id} className="flex items-center gap-4 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 ring-1 ring-border">
                  <Send className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-text">{app.roleTitle ?? app.jobTitle ?? 'Untitled application'}</p>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                    {[app.companyName, app.appliedAt ? `Applied ${formatDate(app.appliedAt)}` : null, app.source, app.interviewCount ? `${app.interviewCount} interviews` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'OFFER' && app.offerAmount != null ? (
                    <span className="rounded-full border border-accent-border bg-accent-muted px-2.5 py-1 font-mono text-[11.5px] text-accent-strong">
                      {app.offerCurrency} {app.offerAmount.toLocaleString()}
                      <span className="text-text-muted">/{app.offerFrequency.toLowerCase()}</span>
                    </span>
                  ) : null}
                  {app.waitingDays != null && app.waitingDays >= 5 ? (
                    <span className="flex items-center gap-1 rounded-full border border-warning/30 bg-warning-muted px-2.5 py-1 text-[11.5px] text-warning">
                      <Clock className="h-3 w-3" strokeWidth={2} />
                      {`${app.waitingDays}d no reply`}
                    </span>
                  ) : null}
                  <select
                    value={app.status}
                    onChange={(e) => move.mutate({ id: app.id, next: e.target.value })}
                    className="h-7 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-[12px] text-text focus:border-accent-border focus:outline-none"
                  >
                    {Object.entries(APPLICATION_STATUS_META).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {t(meta.labelKey)}
                      </option>
                    ))}
                  </select>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(app); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(app)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Send}
          title="No applications yet"
          description="Log an application and drag it through the pipeline as it progresses."
          action={
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Log your first application
            </Button>
          }
        />
      )}

      <ApplicationFormDialog key={editing?.id ?? 'new'} open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} application={editing} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete application?"
          description="This removes the application record."
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
