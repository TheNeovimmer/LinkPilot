import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Check, Import as ImportIcon, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { JOB_STATUS_META, StatusBadge } from '@/components/common/status-badge';
import { JobFormDialog } from '@/components/jobs/job-form';
import { JobAnalyzeDialog } from '@/components/jobs/job-analyze';
import { JobImportDialog } from '@/components/jobs/job-import';
import { cn } from '@/lib/utils';
import { formatSalary, timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import type { Job } from '@/types';

const STATUS_TABS = ['', 'WATCHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'CLOSED'] as const;
const BULK_TARGETS = ['APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'CLOSED'] as const;

export function JobsPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<(typeof STATUS_TABS)[number]>('');
  const [semantic, setSemantic] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Job | null>(null);
  const [analyzing, setAnalyzing] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<Job | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<(typeof BULK_TARGETS)[number]>('APPLIED');

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { q, status, semantic }],
    queryFn: async () => {
      if (semantic) {
        const res = await api.post('/jobs/semantic', { q: semantic, limit: 12 });
        const body = res.data.data as { items: Job[]; mode: 'text' | 'vector' };
        return { items: body.items, semantic: true };
      }
      const res = await api.get('/jobs', { params: { limit: 100, q: q || undefined, status: status || undefined, sortBy: 'updatedAt' } });
      return { items: res.data.data as Job[], semantic: false };
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Job deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const bulkMove = useMutation({
    mutationFn: async ({ ids, status: s }: { ids: string[]; status: string }) => api.patch('/jobs/bulk', { ids, status: s }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Moved ${selected.size} job${selected.size === 1 ? '' : 's'} to ${JOB_STATUS_META[bulkStatus]?.label ?? bulkStatus}`);
      setSelected(new Set());
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Jobs"
        description="Track roles, analyze fit, and keep the pipeline moving."
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <ImportIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
              Import from URL
            </Button>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add job
            </Button>
          </div>
        }
      />

      {/* Search + semantic */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" strokeWidth={1.75} />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSemantic(null);
            }}
            placeholder="Filter by title, company…"
            className="pl-9"
          />
        </div>
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-accent" strokeWidth={1.75} />
          <Input
            value={semantic ?? ''}
            onChange={(e) => setSemantic(e.target.value || null)}
            placeholder="AI semantic search: “remote senior roles, product-led companies”"
            className="border-accent-border/50 pl-9"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full border px-3 py-1 text-[12px] font-medium transition-colors cursor-pointer',
              status === s ? 'border-accent-border bg-accent-muted text-accent' : 'border-border text-text-muted hover:text-text-secondary',
            )}
          >
            {s === '' ? 'All' : JOB_STATUS_META[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-accent-border/60 bg-accent-muted/40 px-3 py-2">
          <span className="font-mono text-[12px] text-accent">{selected.size} selected</span>
          <span className="text-text-muted">→</span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as (typeof BULK_TARGETS)[number])}
            className="h-8 rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 text-[12.5px] text-text focus:border-accent-border focus:outline-none"
          >
            {BULK_TARGETS.map((s) => (
              <option key={s} value={s}>
                {JOB_STATUS_META[s]?.label ?? s}
              </option>
            ))}
          </select>
          <Button size="sm" disabled={bulkMove.isPending} onClick={() => bulkMove.mutate({ ids: [...selected], status: bulkStatus })}>
            {bulkMove.isPending ? 'Moving…' : 'Apply'}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[56px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.items.length ? (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border">
          <div className="divide-y divide-border/60 bg-[#0c0c0f]">
            {data.items.map((job) => (
              <div key={job.id} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-2/40">
                <button
                  onClick={() => toggleSelect(job.id)}
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors cursor-pointer',
                    selected.has(job.id) ? 'border-accent bg-accent text-accent-ink' : 'border-border-strong hover:border-accent-border',
                  )}
                  title="Select"
                >
                  {selected.has(job.id) ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 ring-1 ring-border">
                  <Briefcase className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13.5px] font-medium text-text">{job.title}</p>
                    {job.remote ? <Badge variant="outline" className="hidden sm:inline-flex">Remote</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-text-muted">
                    {[job.companyName, job.location].filter(Boolean).join(' · ') || 'No company'}
                  </p>
                </div>
                <div className="hidden text-right md:block">
                  <p className="font-mono text-[12.5px] text-text-secondary">{formatSalary(job.salaryMin, job.salaryMax)}</p>
                  <p className="mt-0.5 font-mono text-[10px] text-text-muted">{timeAgo(job.updatedAt)}</p>
                </div>
                {job.fitScore != null ? (
                  <div className="hidden w-14 sm:block">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-accent" strokeWidth={1.75} />
                      <span className="font-mono text-[13px] text-text">{Math.round(job.fitScore)}</span>
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-3">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${job.fitScore}%` }} />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAnalyzing(job)}
                    className="hidden rounded-[var(--radius-control)] border border-accent-border/50 px-2.5 py-1 text-[11.5px] text-accent transition-colors hover:bg-accent-muted sm:block cursor-pointer"
                  >
                    Analyze
                  </button>
                )}
                <StatusBadge status={job.status} meta={JOB_STATUS_META} />
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon-sm" onClick={() => setAnalyzing(job)} title="AI analyze / edit">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(job)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title={semantic ? 'No semantic matches' : 'No jobs yet'}
          description={semantic ? 'Try a different description of what you are looking for.' : 'Add the roles you are watching or applying to.'}
          action={
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add your first job
            </Button>
          }
        />
      )}

      <JobFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); setEditing(null); }} job={editing} />
      {analyzing ? <JobAnalyzeDialog job={analyzing} onOpenChange={(v) => !v && setAnalyzing(null)} /> : null}
      <JobImportDialog open={importOpen} onOpenChange={setImportOpen} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete job?"
          description={`This removes “${deleting.title}” and its applications.`}
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
