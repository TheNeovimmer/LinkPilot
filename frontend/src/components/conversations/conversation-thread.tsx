import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, FileText, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { AiComposer } from '@/components/ai/ai-composer';
import { streamAI } from '@/lib/sse';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Conversation, Message } from '@/types';

interface ConversationThreadProps {
  conversation: Conversation;
  onEdit: () => void;
  onDeleted: () => void;
}

function MessageBubble({ message }: { message: Message }) {
  const isMe = message.role === 'ME';
  return (
    <div className={cn('flex w-full', isMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-[var(--radius-card)] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
          isMe
            ? 'rounded-br-[4px] border border-accent-border bg-accent-muted/70 text-text'
            : 'rounded-bl-[4px] border border-border bg-surface-2 text-text-secondary',
        )}
      >
        {message.content}
        <div className={cn('mt-1 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-wide', isMe ? 'justify-end text-text-muted/60' : 'text-text-muted/60')}>
          {message.role === 'AI' ? 'AI' : isMe ? 'You' : 'Them'} · {timeAgo(message.createdAt)}
        </div>
      </div>
    </div>
  );
}

export function ConversationThread({ conversation, onEdit, onDeleted }: ConversationThreadProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const queryClient = useQueryClient();

  // Cursor pagination: newest 100 first, older chunks prepended on demand.
  const [chunks, setChunks] = useState<{ cursor: string | null; items: Message[] }[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversation.id, cursor ?? 'latest'],
    queryFn: async () => {
      const res = await api.get(`/conversations/${conversation.id}/messages`, {
        params: { limit: 100, before: cursor ?? undefined },
      });
      return { items: res.data.data as Message[], total: (res.data.meta as { total: number } | undefined)?.total ?? res.data.items.length };
    },
    enabled: !!conversation.id,
  });

  // Accumulate chunks in fetch order (newest → older); the response is already ascending within a chunk.
  useEffect(() => {
    if (!data) return;
    setChunks((prev) => (prev.some((c) => c.cursor === cursor) ? prev : [...prev, { cursor, items: data.items }]));
  }, [data, cursor]);

  useEffect(() => {
    setChunks([]);
    setCursor(null);
  }, [conversation.id]);

  const messages = chunks.flatMap((c) => c.items);
  const loaded = messages.length;
  const hasMore = data ? loaded < data.total : false;
  const loadEarlier = () => {
    const oldest = chunks.at(-1)?.items[0];
    if (oldest) setCursor(oldest.createdAt);
  };

  const summarize = async () => {
    setSummarizing(true);
    setSummary(null);
    try {
      await streamAI(
        '/ai/summarize',
        { conversationId: conversation.id },
        {
          onDelta: (t) => setSummary((prev) => (prev ?? '') + t),
          onDone: () => setSummarizing(false),
          onError: (err) => {
            setSummarizing(false);
            toast.error(err.message);
          },
        },
      );
    } catch (err) {
      setSummarizing(false);
      toast.error(apiErrorMessage(err));
    }
  };

  const remove = async () => {
    try {
      await api.delete(`/conversations/${conversation.id}`);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Conversation deleted');
      onDeleted();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link to="/conversations" className="flex h-6 w-6 items-center justify-center rounded-[6px] text-text-muted transition-colors hover:bg-surface-2 hover:text-text lg:hidden">
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Link>
            <h2 className="truncate text-[14px] font-semibold tracking-tight text-text">{conversation.contactName}</h2>
          </div>
          <p className="mt-0.5 truncate text-[12px] text-text-muted">{conversation.contactHeadline ?? conversation.companyName ?? 'Contact'}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={summarize} disabled={summarizing} title="AI summary of this conversation">
            <FileText className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
            {summarizing ? '…' : 'Summarize'}
          </Button>
          {conversation.contactLinkedInUrl ? (
            <Button variant="ghost" size="icon-sm" asChild title="Open LinkedIn profile">
              <a href={conversation.contactLinkedInUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </Button>
          ) : null}
          <Button variant="ghost" size="icon-sm" onClick={onEdit} title="Edit conversation">
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteOpen(true)} title="Delete conversation">
            <Trash2 className="h-3.5 w-3.5 text-destructive" strokeWidth={1.75} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {hasMore ? (
          <button
            onClick={loadEarlier}
            className="mx-auto flex w-full items-center justify-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2/60 py-2 text-[12px] text-text-muted transition-colors hover:border-accent-border hover:text-text cursor-pointer"
          >
            Load earlier messages ({data ? data.total - loaded : 0} more)
          </button>
        ) : null}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="ml-auto h-14 w-2/3 rounded-[var(--radius-card)]" />
            <Skeleton className="h-14 w-2/3 rounded-[var(--radius-card)]" />
            <Skeleton className="ml-auto h-20 w-3/5 rounded-[var(--radius-card)]" />
          </div>
        ) : messages?.length ? (
          <>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {/* Summary panel */}
            {summary || summarizing ? (
              <div className="rounded-[var(--radius-card)] border border-border bg-surface-2 p-4">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
                  {summarizing ? <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-accent" /> : <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />}
                  {summarizing ? 'Summarizing…' : 'AI summary'}
                </div>
                <p className={cn('mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-text-secondary', summarizing && 'lp-caret')}>
                  {summary ?? ''}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-card)] border border-border bg-surface-2">
              <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text">Start the conversation</p>
              <p className="mx-auto mt-1 max-w-[34ch] text-[12px] leading-relaxed text-text-muted">
                Add the messages you've exchanged, then use the AI to draft your reply.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <AiComposer
        conversationId={conversation.id}
        onMessageInserted={() => queryClient.invalidateQueries({ queryKey: ['dashboard'] })}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete conversation?"
        description={`This permanently removes the conversation with ${conversation.contactName} and all its messages.`}
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </div>
  );
}
