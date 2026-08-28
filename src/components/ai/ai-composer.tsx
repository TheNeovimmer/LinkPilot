import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  CornerDownLeft,
  Plus,
  Redo2,
  Send,
  Sparkles,
  Square,
  Wand2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { api, apiErrorMessage } from '@/lib/api';
import { streamAI } from '@/lib/sse';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'confident', label: 'Confident' },
  { value: 'casual', label: 'Casual' },
  { value: 'concise', label: 'Concise' },
];

interface AiComposerProps {
  conversationId: string;
  onMessageInserted?: (text: string) => void;
  /** Callback when the user clicks "New message from them" style actions. */
}

/**
 * Message composer with the AI draft flow:
 * type → "Draft reply" streams an AI suggestion (editable) → insert / copy / rewrite.
 */
export function AiComposer({ conversationId, onMessageInserted }: AiComposerProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [role, setRole] = useState<'ME' | 'THEM'>('ME');

  // Draft state
  const [draftOpen, setDraftOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [mode, setMode] = useState<'draft' | 'rewrite'>('draft');
  const [tone, setTone] = useState('professional');
  const [showContext, setShowContext] = useState(false);
  const [extraContext, setExtraContext] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const draftRef = useRef('');

  useEffect(() => () => abortRef.current?.abort(), []);

  const appendDraft = (delta: string) => {
    draftRef.current += delta;
    setDraft(draftRef.current);
  };

  const runStream = async (path: string, body: Record<string, unknown>) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    draftRef.current = '';
    setDraft('');
    setDraftOpen(true);
    setMode(path.includes('rewrite') ? 'rewrite' : 'draft');
    try {
      await streamAI(
        path,
        body,
        {
          onDelta: appendDraft,
          onDone: () => setStreaming(false),
          onError: (err) => {
            setStreaming(false);
            toast.error(err.message);
          },
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setStreaming(false);
        toast.error(apiErrorMessage(err));
      }
    }
  };

  const draftReply = () => {
    if (streaming) return;
    void runStream('/ai/draft-reply', {
      conversationId,
      tone,
      ...(extraContext.trim() ? { extraContext: extraContext.trim() } : {}),
    });
  };

  const rewrite = () => {
    if (streaming || !draft.trim()) return;
    void runStream('/ai/rewrite', { text: draft, tone });
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const insertAsMessage = async () => {
    if (!draft.trim() || streaming) return;
    try {
      await api.post(`/conversations/${conversationId}/messages`, { role: 'ME', content: draft.trim() });
      setDraft('');
      setDraftOpen(false);
      setExtraContext('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onMessageInserted?.(draft.trim());
      toast.success('Draft sent as your message');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    toast.success('Copied to clipboard');
  };

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    try {
      await api.post(`/conversations/${conversationId}/messages`, { role, content: input.trim() });
      setInput('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-[#0c0c0f] p-3">
      {/* AI draft panel */}
      {draftOpen ? (
        <div className="rounded-[var(--radius-card)] border border-accent-border bg-accent-muted/60">
          <div className="flex flex-wrap items-center gap-2 border-b border-accent-border/40 px-3 py-2">
            <span className="flex items-center gap-1.5 text-[12px] font-medium text-accent">
              {streaming ? (
                <>
                  <span className="lp-pulse h-1.5 w-1.5 rounded-full bg-accent" />
                  {mode === 'rewrite' ? 'Rewriting…' : 'Drafting reply…'}
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                  AI draft — review before sending
                </>
              )}
            </span>
            <div className="ml-auto flex items-center gap-1.5">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="h-7 w-[130px] text-[12px]">
                  <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="icon-sm" variant="ghost" onClick={rewrite} disabled={streaming || !draft.trim()} title="Rewrite with current tone">
                <Redo2 className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={copyDraft} disabled={!draft.trim()} title="Copy">
                <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={streaming ? stopStreaming : () => setDraftOpen(false)}
                title={streaming ? 'Stop' : 'Discard'}
              >
                {streaming ? <Square className="h-3.5 w-3.5" strokeWidth={1.75} /> : <X className="h-3.5 w-3.5" strokeWidth={1.75} />}
              </Button>
            </div>
          </div>
          <div className="p-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={streaming}
              className={cn('min-h-[110px] resize-y border-transparent bg-transparent focus:border-transparent focus:ring-0', streaming && 'lp-caret')}
              placeholder="Drafting…"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-3 pb-3">
            <Button variant="secondary" size="sm" onClick={copyDraft} disabled={!draft.trim()}>
              <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              Copy
            </Button>
            <Button size="sm" onClick={insertAsMessage} disabled={!draft.trim() || streaming}>
              <CornerDownLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
              Insert as message
            </Button>
          </div>
        </div>
      ) : null}

      {/* Compose row */}
      <div className="flex items-end gap-2">
        <div className="flex shrink-0 flex-col gap-1">
          <div className="flex rounded-[var(--radius-control)] border border-border bg-surface p-0.5">
            {(['ME', 'THEM'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn(
                  'rounded-[6px] px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                  role === r ? 'bg-surface-3 text-text' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                {r === 'ME' ? 'Me' : 'Them'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowContext((v) => !v)}
            className="flex items-center justify-center gap-1 rounded-[var(--radius-control)] px-1.5 py-1 text-[11px] text-text-muted transition-colors hover:text-text cursor-pointer"
          >
            <Plus className="h-3 w-3" strokeWidth={1.75} />
            Context
          </button>
        </div>
        <div className="flex-1">
          {showContext ? (
            <input
              value={extraContext}
              onChange={(e) => setExtraContext(e.target.value)}
              placeholder="Extra context for the AI (e.g. we met at a conference)…"
              className="mb-2 h-8 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-[12.5px] text-text placeholder:text-text-muted focus:border-accent-border focus:outline-none"
            />
          ) : null}
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={role === 'ME' ? 'Write a message you sent…' : 'Paste the message you received…'}
            className="min-h-[44px] max-h-[140px] resize-none"
          />
        </div>
        <div className="flex shrink-0 flex-col gap-1.5">
          <Button onClick={sendMessage} disabled={!input.trim() || streaming} title="Send message (Enter)">
            <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
          </Button>
          <Button
            variant={streaming ? 'secondary' : 'default'}
            onClick={streaming ? stopStreaming : draftReply}
            disabled={!streaming && false}
            title={streaming ? 'Stop drafting' : 'Draft reply with AI'}
          >
            {streaming ? (
              <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <Wand2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
