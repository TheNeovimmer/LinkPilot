'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Pin, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { NoteFormDialog } from '@/components/notes/note-form';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import type { Note } from '@/types';

export function NotesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(searchParams.get('new') === '1');
  const [editing, setEditing] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState<Note | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notes', q, tag],
    queryFn: async () =>
      (await api.get('/notes', { params: { limit: 100, q: q || undefined, tag: tag ?? undefined, sortBy: 'updatedAt' } })).data.data as Note[],
  });

  const { data: tags } = useQuery({
    queryKey: ['notes', 'tags'],
    queryFn: async () => (await api.get('/notes/tags')).data.data as string[],
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => api.patch(`/notes/${id}`, { pinned }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] }),
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast.success('Note deleted');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notes"
        description="Snippets, takeaways and follow-ups."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
            New note
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" strokeWidth={1.75} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-9" />
        </div>
        {tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors cursor-pointer',
                  tag === t ? 'border-accent-border bg-accent-muted text-accent' : 'border-border text-text-muted hover:text-text-secondary',
                )}
              >
                #{t}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((note) => (
            <div
              key={note.id}
              className="group flex cursor-pointer flex-col gap-2 rounded-[var(--radius-card)] border border-border bg-[#0c0c0f] p-4 transition-colors hover:border-border-strong"
              onClick={() => { setEditing(note); setFormOpen(true); }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="truncate text-[13.5px] font-medium text-text">{note.title}</h3>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={(e) => { e.stopPropagation(); togglePin.mutate({ id: note.id, pinned: !note.pinned }); }}
                    className="rounded-[6px] p-1 text-text-muted transition-colors hover:text-accent cursor-pointer"
                    title={note.pinned ? 'Unpin' : 'Pin'}
                  >
                    <Pin className={cn('h-3.5 w-3.5', note.pinned && 'fill-accent text-accent')} strokeWidth={1.75} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(note); }}
                    className="rounded-[6px] p-1 text-text-muted opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <p className="line-clamp-4 flex-1 text-[12.5px] leading-relaxed text-text-muted">{note.content || 'No content'}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {note.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[10px] text-text-muted">
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="shrink-0 font-mono text-[10px] text-text-muted/70">{timeAgo(note.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={StickyNote}
          title={q || tag ? 'No matching notes' : 'No notes yet'}
          description={q || tag ? 'Try a different search or tag.' : 'Capture interview takeaways, company research, follow-ups.'}
          action={
            <Button size="sm" variant="secondary" onClick={() => setFormOpen(true)}>
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Write a note
            </Button>
          }
        />
      )}

      <NoteFormDialog open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} note={editing} />
      {deleting ? (
        <ConfirmDialog
          open
          onOpenChange={() => setDeleting(null)}
          title="Delete note?"
          description={`This permanently deletes “${deleting.title}”.`}
          confirmLabel="Delete"
          onConfirm={() => remove.mutate(deleting.id)}
        />
      ) : null}
    </div>
  );
}
