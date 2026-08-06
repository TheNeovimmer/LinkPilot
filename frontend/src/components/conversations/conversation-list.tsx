import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, MessageSquare, Pin, Search } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import type { Conversation } from '@/types';

export function ConversationList() {
  const { id: activeId } = useParams();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ARCHIVED' | ''>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['conversations', q, status],
    queryFn: async () =>
      (
        await api.get('/conversations', {
          params: { limit: 50, q: q || undefined, status: status || undefined },
        })
      ).data.data as Conversation[],
  });

  const toggleArchive = async (c: Conversation, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.patch(`/conversations/${c.id}`, { status: c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE' });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(c.status === 'ACTIVE' ? 'Conversation archived' : 'Conversation restored');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" strokeWidth={1.75} />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts…" className="pl-8" />
        </div>
        <div className="flex gap-1">
          {(['', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                'rounded-full border px-2.5 py-0.5 text-[11.5px] font-medium transition-colors cursor-pointer',
                status === s
                  ? 'border-accent-border bg-accent-muted text-accent'
                  : 'border-border text-text-muted hover:text-text-secondary',
              )}
            >
              {s === '' ? 'All' : s === 'ACTIVE' ? 'Active' : 'Archived'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-1 p-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[52px] rounded-[var(--radius-control)]" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="space-y-0.5 p-2">
            {data.map((c) => (
              <Link
                key={c.id}
                to={`/conversations/${c.id}`}
                className={cn(
                  'group relative flex items-start gap-2.5 rounded-[var(--radius-control)] px-2.5 py-2.5 transition-colors',
                  activeId === c.id ? 'bg-surface-2 ring-1 ring-border-strong' : 'hover:bg-surface-2/60',
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[12px] font-semibold text-text-secondary ring-1 ring-border-strong">
                  {c.contactName.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[13px] font-medium text-text">{c.contactName}</p>
                    {c.pinned ? <Pin className="h-3 w-3 shrink-0 text-accent" strokeWidth={1.75} /> : null}
                  </div>
                  <p className="truncate text-[11.5px] text-text-muted">{c.contactHeadline ?? c.companyName ?? 'Conversation'}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted/70">{timeAgo(c.lastMessageAt)}</span>
                    <span className="flex items-center gap-0.5 font-mono text-[10px] text-text-muted/70">
                      <MessageSquare className="h-2.5 w-2.5" strokeWidth={1.75} /> {c.messageCount}
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => toggleArchive(c, e)}
                  title={c.status === 'ACTIVE' ? 'Archive' : 'Restore'}
                  className="mt-1 rounded-[6px] p-1 text-text-muted opacity-0 transition-all hover:bg-surface-3 hover:text-text group-hover:opacity-100 cursor-pointer"
                >
                  {c.status === 'ACTIVE' ? <Archive className="h-3.5 w-3.5" strokeWidth={1.75} /> : <ArchiveRestore className="h-3.5 w-3.5" strokeWidth={1.75} />}
                </button>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MessageSquare}
            title={q || status ? 'No matching conversations' : 'No conversations yet'}
            description={q || status ? 'Try a different search or filter.' : 'Track recruiter and hiring-manager chats here.'}
          />
        )}
      </div>
    </div>
  );
}
