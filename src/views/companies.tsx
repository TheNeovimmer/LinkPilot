'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, ExternalLink, MapPin, Plus, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CompanyFormDialog } from '@/components/companies/company-form';
import { toast } from 'sonner';
import type { Company } from '@/types';

export function CompaniesPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies', q],
    queryFn: async () => (await api.get('/companies', { params: { limit: 100, q: q || undefined } })).data.data as Company[],
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Company deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Companies"
        description="The organizations in your job search, with their open roles and contacts."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            Add company
          </Button>
        }
      />

      <div className="relative max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search companies or industries…" />
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div key={c.id} className="group flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-[#0c0c0f] p-4 transition-colors hover:border-border-strong">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-surface-3 ring-1 ring-border-strong">
                  <Building2 className="h-4.5 w-4.5 text-text-secondary" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-text">{c.name}</p>
                  <p className="truncate text-[12px] text-text-muted">{c.industry || 'No industry listed'}</p>
                </div>
              </div>

              {c.location ? (
                <p className="flex items-center gap-1.5 text-[12px] text-text-muted">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  {c.location}
                </p>
              ) : null}

              {c.notes ? (
                <p className="line-clamp-2 text-[12px] leading-relaxed text-text-secondary">{c.notes}</p>
              ) : null}

              <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2.5">
                <div className="flex gap-3 text-[12px] text-text-muted">
                  <span>
                    <span className="font-medium text-text-secondary">{c.jobCount}</span> jobs
                  </span>
                  <span>
                    <span className="font-medium text-text-secondary">{c.recruiterCount}</span> recruiters
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {c.website ? (
                    <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 p-1 text-[12px] text-accent hover:underline">
                      <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
                      Site
                    </a>
                  ) : null}
                  <Button variant="ghost" size="icon-sm" onClick={() => { setEditing(c); setFormOpen(true); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(c)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Building2}
          title={q ? 'No matching companies' : 'No companies yet'}
          description="Companies connect your jobs, recruiters and conversations."
          action={
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Add a company
            </Button>
          }
        />
      )}

      <CompanyFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} company={editing} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete company?"
          description={`This removes ${deleting.name}. Linked jobs, recruiters and conversations keep their data.`}
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
