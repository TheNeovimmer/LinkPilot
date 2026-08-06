import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { ExternalLink, Linkedin, Mail, Phone, Plus, Trash2, Users } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { RECRUITER_STATUS_META, StatusBadge } from '@/components/common/status-badge';
import { RecruiterFormDialog } from '@/components/recruiters/recruiter-form';
import { toast } from 'sonner';
import type { Recruiter } from '@/types';

export function RecruitersPage() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Recruiter | null>(null);
  const [deleting, setDeleting] = useState<Recruiter | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recruiters', q],
    queryFn: async () => (await api.get('/recruiters', { params: { limit: 100, q: q || undefined } })).data.data as Recruiter[],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/recruiters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiters'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Recruiter deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Recruiters"
        description="Everyone you are talking to across companies."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Add recruiter
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or company…" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((r) => (
            <div key={r.id} className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-[#0c0c0f] p-4 transition-colors hover:border-border-strong">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[14px] font-semibold text-text-secondary ring-1 ring-border-strong">
                  {r.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[13.5px] font-medium text-text">{r.name}</p>
                    {r.companyName ? <Linkedin className="h-3 w-3 shrink-0 text-text-muted" strokeWidth={1.75} /> : null}
                  </div>
                  <p className="truncate text-[12px] text-text-muted">{r.title || r.companyName || 'Recruiter'}</p>
                </div>
                <StatusBadge status={r.status} meta={RECRUITER_STATUS_META} />
              </div>

              {(r.email || r.phone) ? (
                <div className="flex flex-col gap-1">
                  {r.email ? (
                    <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 truncate text-[12px] text-text-muted transition-colors hover:text-text">
                      <Mail className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      <span className="truncate">{r.email}</span>
                    </a>
                  ) : null}
                  {r.phone ? (
                    <p className="flex items-center gap-1.5 text-[12px] text-text-muted">
                      <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                      {r.phone}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-[12px] text-text-muted/60">No contact details yet</p>
              )}

              <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2.5">
                {r.linkedinUrl ? (
                  <a href={r.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] text-accent hover:underline">
                    <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                    LinkedIn
                  </a>
                ) : (
                  <span />
                )}
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(r); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(r)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={q ? 'No matching recruiters' : 'No recruiters yet'}
          description="Add the people you are in touch with, and LinkPilot keeps the context."
          action={
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add a recruiter
            </Button>
          }
        />
      )}

      <RecruiterFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} recruiter={editing} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete recruiter?"
          description={`This removes ${deleting.name} and their details.`}
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
