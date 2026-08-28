import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Sparkles, TriangleAlert } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Job } from '@/types';

interface JobAnalysisResult {
  fitScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  questions: string[];
  salaryNote?: string;
  nextSteps: string[];
}

export function JobAnalyzeDialog({ job, onOpenChange }: { job: Job; onOpenChange: (open: boolean) => void }) {
  const [error, setError] = useState<string | null>(null);

  const { data, isFetching, refetch } = useQuery({
    queryKey: ['job-analysis', job.id],
    queryFn: async () => {
      setError(null);
      try {
        const res = await api.post('/ai/analyze-job', { jobId: job.id });
        return res.data.data as JobAnalysisResult;
      } catch (err) {
        setError(apiErrorMessage(err));
        throw err;
      }
    },
    retry: false,
    enabled: true,
  });

  const result = data;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            AI fit analysis
          </DialogTitle>
          <DialogDescription>
            {job.title} · {job.companyName ?? 'Unknown company'}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted p-6 text-center">
            <TriangleAlert className="h-5 w-5 text-warning" strokeWidth={1.75} />
            <p className="text-[13px] text-text-secondary">{error}</p>
            <p className="text-[12px] text-text-muted">Make sure AI_API_KEY is configured and the job has a description.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isFetching && !result ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-accent" strokeWidth={1.75} />
            <p className="text-[13px] text-text-muted">Analyzing fit against your profile…</p>
          </div>
        ) : result ? (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-accent-border/50 bg-accent-muted/50 p-4">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="var(--border-strong)" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${(result.fitScore / 100) * 163.4} 163.4`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[16px] font-semibold text-text">
                  {Math.round(result.fitScore)}
                </span>
              </div>
              <div className="flex-1">
                <Badge variant="default" className="mb-1.5">
                  Fit score
                </Badge>
                <p className="text-[13px] leading-relaxed text-text-secondary">{result.summary}</p>
              </div>
            </div>

            <AnalysisSection title="Strengths" tone="positive" items={result.strengths} />
            <AnalysisSection title="Gaps to address" tone="warning" items={result.gaps} />
            <AnalysisSection title="Questions worth asking" tone="neutral" items={result.questions} />
            {result.salaryNote ? <AnalysisSection title="Compensation" tone="neutral" items={[result.salaryNote]} /> : null}
            <AnalysisSection title="Recommended next steps" tone="accent" items={result.nextSteps} />

            <p className="font-mono text-[10px] text-text-muted/70">Analysis is saved to this job automatically.</p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AnalysisSection({ title, items, tone }: { title: string; items: string[]; tone: 'positive' | 'warning' | 'neutral' | 'accent' }) {
  if (!items?.length) return null;
  const color =
    tone === 'positive' ? 'text-accent' : tone === 'warning' ? 'text-warning' : tone === 'accent' ? 'text-violet' : 'text-text-secondary';
  return (
    <div>
      <p className={`mb-1.5 text-[12px] font-medium ${color}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-text-muted">
            <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone === 'positive' ? 'text-accent' : 'text-text-muted'}`} strokeWidth={1.75} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
