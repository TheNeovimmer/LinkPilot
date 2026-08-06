import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { toast } from 'sonner';
import type { Interview } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  scheduledAt: z.string().min(1, 'Date & time required'),
  durationMin: z.coerce.number().int().min(5).max(480),
  mode: z.string(),
  status: z.string(),
  jobId: z.string().optional().or(z.literal('')),
  recruiterId: z.string().optional().or(z.literal('')),
  location: z.string().max(300).optional().or(z.literal('')),
  feedback: z.string().max(5000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function InterviewFormDialog({
  open,
  onOpenChange,
  interview,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  interview: Interview | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(interview);
  const { data: jobs } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 100 } })).data.data as { id: string; title: string; companyName: string | null }[],
  });
  const { data: recruiters } = useQuery({
    queryKey: ['recruiters', 'all'],
    queryFn: async () => (await api.get('/recruiters', { params: { limit: 100 } })).data.data as { id: string; name: string }[],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', scheduledAt: '', durationMin: 45, mode: 'VIDEO', status: 'SCHEDULED', jobId: '', recruiterId: '', location: '', feedback: '' },
  });

  useEffect(() => {
    if (open) {
      const d = interview?.scheduledAt ? new Date(interview.scheduledAt) : new Date(Date.now() + 86_400_000);
      const toLocal = (dt: Date) => {
        const p = (n: number) => String(n).padStart(2, '0');
        return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`;
      };
      reset({
        title: interview?.title ?? '',
        scheduledAt: toLocal(d),
        durationMin: interview?.durationMin ?? 45,
        mode: interview?.mode ?? 'VIDEO',
        status: interview?.status ?? 'SCHEDULED',
        jobId: interview?.jobId ?? '',
        recruiterId: interview?.recruiterId ?? '',
        location: interview?.location ?? '',
        feedback: interview?.feedback ?? '',
      });
    }
  }, [open, interview, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      scheduledAt: new Date(values.scheduledAt).toISOString(),
      durationMin: values.durationMin,
      mode: values.mode,
      status: values.status,
      jobId: values.jobId || null,
      recruiterId: values.recruiterId || null,
      location: values.location || null,
      feedback: values.feedback || null,
    };
    try {
      if (isEdit) {
        await api.patch(`/interviews/${interview!.id}`, payload);
        toast.success('Interview updated');
      } else {
        await api.post('/interviews', payload);
        toast.success('Interview scheduled');
      }
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit interview' : 'Schedule an interview'}</DialogTitle>
          <DialogDescription>Keep every round on the calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="Technical screen — round 2" {...register('title')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date & time" error={errors.scheduledAt?.message}>
              <Input type="datetime-local" {...register('scheduledAt')} />
            </Field>
            <Field label="Duration (min)" error={errors.durationMin?.message}>
              <Input type="number" {...register('durationMin')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mode">
              <select {...register('mode')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                {(['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL'] as const).map((m) => (
                  <option key={m} value={m}>
                    {m.charAt(0) + m.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select {...register('status')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                {(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'] as const).map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Job">
              <select {...register('jobId')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                <option value="">None</option>
                {jobs?.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recruiter">
              <select {...register('recruiterId')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                <option value="">None</option>
                {recruiters?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Location / link">
            <Input placeholder="https://meet.google.com/…" {...register('location')} />
          </Field>
          {isEdit ? (
            <Field label="Feedback">
              <Input placeholder="How did it go?" {...register('feedback')} />
            </Field>
          ) : null}
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
