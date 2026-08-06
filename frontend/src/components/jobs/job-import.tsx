import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Job } from '@/types';

/** Paste a job posting URL or text — the AI extracts a structured job. */
export function JobImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');

  const importJob = useMutation({
    mutationFn: async (): Promise<Job> => {
      const res = await api.post('/jobs/import', { text });
      return res.data.data as Job;
    },
    onSuccess: (job) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Imported “${job.title}”`);
      setText('');
      onOpenChange(false);
    },
    onError: (err) => {
      const msg = apiErrorMessage(err);
      toast.error(msg === 'AI features not configured' ? 'Set AI_API_KEY in the backend env to import jobs with AI' : msg);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
            Import a job posting
          </DialogTitle>
          <DialogDescription>
            Paste the posting URL or the full text. The AI extracts title, company, salary and description, then saves it to your Jobs.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim().length >= 20) importJob.mutate();
          }}
          className="flex flex-col gap-4"
        >
          <Textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'https://jobs.company.com/…\n\nOr paste the job description text directly here…'}
            className="font-mono text-[12.5px]"
          />
          <p className="text-[11.5px] text-text-muted/70">At least 20 characters. Company is matched to an existing one by name when possible.</p>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={importJob.isPending || text.trim().length < 20}>
              {importJob.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} /> : <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />}
              Extract & save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
