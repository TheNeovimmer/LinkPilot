import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { JOB_STATUS_META } from '@/components/common/status-badge';
import { toast } from 'sonner';
import type { Job } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  companyId: z.string().optional().or(z.literal('')),
  url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  description: z.string().max(50_000).optional(),
  location: z.string().max(200).optional(),
  remote: z.boolean().optional(),
  salaryMin: z.coerce.number().int().nonnegative().optional(),
  salaryMax: z.coerce.number().int().nonnegative().optional(),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function JobFormDialog({ open, onOpenChange, job }: { open: boolean; onOpenChange: (v: boolean) => void; job: Job | null }) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(job);
  const { data: companies } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: async () => (await api.get('/companies/all')).data.data as { id: string; name: string }[],
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', companyId: '', url: '', description: '', location: '', remote: false, salaryMin: undefined, salaryMax: undefined, status: 'WATCHLIST' },
  });
  const remote = watch('remote');

  useEffect(() => {
    if (open) {
      reset({
        title: job?.title ?? '',
        companyId: job?.companyId ?? '',
        url: job?.url ?? '',
        description: job?.description ?? '',
        location: job?.location ?? '',
        remote: job?.remote ?? false,
        salaryMin: job?.salaryMin ?? undefined,
        salaryMax: job?.salaryMax ?? undefined,
        status: job?.status ?? 'WATCHLIST',
      });
    }
  }, [open, job, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      companyId: values.companyId || undefined,
      url: values.url || undefined,
      salaryMin: values.salaryMin || null,
      salaryMax: values.salaryMax || null,
    };
    try {
      if (isEdit) {
        await api.patch(`/jobs/${job!.id}`, payload);
        toast.success('Job updated');
      } else {
        await api.post('/jobs', payload);
        toast.success('Job added');
      }
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit job' : 'Add a job'}</DialogTitle>
          <DialogDescription>Track a role you are watching, applying to, or interviewing for.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="Senior Frontend Engineer" {...register('title')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Company">
              <select {...register('companyId')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                <option value="">None</option>
                {companies?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location">
              <Input placeholder="Remote / Berlin / …" {...register('location')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Salary min (USD)">
              <Input type="number" placeholder="120000" {...register('salaryMin')} />
            </Field>
            <Field label="Salary max (USD)">
              <Input type="number" placeholder="160000" {...register('salaryMax')} />
            </Field>
          </div>
          <Field label="URL">
            <Input placeholder="https://jobs.company.com/…" {...register('url')} />
          </Field>
          <Field label="Description">
            <Textarea className="min-h-[90px]" placeholder="Paste the job description — the AI uses it for fit analysis." {...register('description')} />
          </Field>
          <div className="flex items-center gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
              <input type="checkbox" checked={remote} onChange={(e) => setValue('remote', e.target.checked)} className="h-4 w-4 rounded border-border bg-surface-2 accent-[#3ddc97]" />
              Remote
            </label>
            <Field label="Status" className="flex-1">
              <select {...register('status')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                {Object.entries(JOB_STATUS_META).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add job'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
