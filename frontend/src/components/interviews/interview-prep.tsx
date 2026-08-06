import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import type { Interview } from '@/types';

interface InterviewPrepResult {
  overview: string;
  topics: string[];
  likelyQuestions: { question: string; sampleAnswer: string }[];
  tips: string[];
  questionsToAsk: string[];
}

export function InterviewPrepDialog({ interview, onOpenChange }: { interview: Interview; onOpenChange: (v: boolean) => void }) {
  const [error, setError] = useState<string | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['interview-prep', interview.id],
    queryFn: async () => {
      setError(null);
      try {
        const res = await api.post('/ai/interview-prep', { interviewId: interview.id });
        return res.data.data as InterviewPrepResult;
      } catch (err) {
        setError(apiErrorMessage(err));
        throw err;
      }
    },
    retry: false,
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Interview prep
          </DialogTitle>
          <DialogDescription>
            {interview.title} · {formatDateTime(interview.scheduledAt)}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted p-6 text-center">
            <TriangleAlert className="h-5 w-5 text-warning" strokeWidth={1.75} />
            <p className="text-[13px] text-text-secondary">{error}</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isFetching ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" strokeWidth={1.75} />
            <p className="text-[13px] text-text-muted">Preparing you for this round…</p>
          </div>
        ) : data ? (
          <div className="max-h-[65vh] space-y-5 overflow-y-auto pr-1">
            <section>
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-accent">Overview</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{data.overview}</p>
            </section>

            <section>
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">Topics to review</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.topics.map((t, i) => (
                  <span key={i} className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-[12px] text-text-secondary">
                    {t}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">Likely questions</h3>
              <div className="mt-2 space-y-3">
                {data.likelyQuestions.map((q, i) => (
                  <div key={i} className="rounded-[var(--radius-control)] border border-border bg-surface-2 p-3">
                    <p className="flex gap-2 text-[13px] font-medium text-text">
                      <span className="font-mono text-[11px] text-accent">{i + 1}.</span>
                      {q.question}
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-text-muted">{q.sampleAnswer}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">Tips</h3>
              <ul className="mt-2 space-y-1.5">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.75} />
                    {tip}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-[12px] font-medium uppercase tracking-wide text-text-secondary">Questions to ask them</h3>
              <ul className="mt-2 space-y-1.5">
                {data.questionsToAsk.map((q, i) => (
                  <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-text-muted">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
                    {q}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
