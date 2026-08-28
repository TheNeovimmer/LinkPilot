import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { AttachmentList } from '@/components/attachments/attachment-list';
import { toast } from 'sonner';
import type { Application } from '@/types';

const schema = z.object({
  jobId: z.string().optional().or(z.literal('')),
  companyName: z.string().max(200).optional().or(z.literal('')),
  roleTitle: z.string().max(300).optional().or(z.literal('')),
  status: z.string(),
  source: z.string().max(100).optional().or(z.literal('')),
  appliedAt: z.string().optional(),
  notes: z.string().max(10_000).optional().or(z.literal('')),
  coverLetter: z.string().max(20_000).optional().or(z.literal('')),
  offerAmount: z.string().optional().or(z.literal('')),
  offerCurrency: z.string().length(3).optional().or(z.literal('')),
  offerFrequency: z.string().optional(),
  offerStatus: z.string().optional(),
  offerNotes: z.string().max(5000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

function TitleCase(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  application: Application | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(application);
  const { data: jobs } = useQuery({
    queryKey: ['jobs', 'all'],
    queryFn: async () => (await api.get('/jobs', { params: { limit: 100 } })).data.data as { id: string; title: string; companyName: string | null }[],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jobId: '',
      companyName: '',
      roleTitle: '',
      status: 'DRAFT',
      source: '',
      appliedAt: '',
      notes: '',
      coverLetter: '',
      offerAmount: '',
      offerCurrency: 'USD',
      offerFrequency: 'YEARLY',
      offerStatus: 'PENDING',
      offerNotes: '',
    },
  });

  // Tracked directly so the offer section can appear without `watch()` (which the
  // React Compiler warns on). Initialized lazily so remounts (keyed by application)
  // start with the right value.
  const [status, setStatus] = useState<string>(() => application?.status ?? 'DRAFT');

  useEffect(() => {
    if (open) {
      reset({
        jobId: application?.jobId ?? '',
        companyName: application?.companyName ?? '',
        roleTitle: application?.roleTitle ?? '',
        status: application?.status ?? 'DRAFT',
        source: application?.source ?? '',
        appliedAt: application?.appliedAt ? new Date(application.appliedAt).toISOString().slice(0, 10) : '',
        notes: application?.notes ?? '',
        coverLetter: application?.coverLetter ?? '',
        offerAmount: application?.offerAmount != null ? String(application.offerAmount) : '',
        offerCurrency: application?.offerCurrency ?? 'USD',
        offerFrequency: application?.offerFrequency ?? 'YEARLY',
        offerStatus: application?.offerStatus ?? '',
        offerNotes: application?.offerNotes ?? '',
      });
    }
  }, [open, application, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      jobId: values.jobId || null,
      companyName: values.companyName || null,
      roleTitle: values.roleTitle || null,
      source: values.source || null,
      appliedAt: values.appliedAt ? new Date(values.appliedAt).toISOString() : null,
      notes: values.notes || null,
      coverLetter: values.coverLetter || null,
      offerAmount: values.offerAmount ? Number(values.offerAmount) : null,
      offerCurrency: values.offerCurrency || 'USD',
      offerFrequency: values.offerFrequency || 'YEARLY',
      offerStatus: values.offerStatus || null,
      offerNotes: values.offerNotes || null,
    };
    try {
      if (isEdit) {
        await api.patch(`/applications/${application!.id}`, payload);
        toast.success('Application updated');
      } else {
        await api.post('/applications', payload);
        toast.success('Application logged');
      }
      queryClient.invalidateQueries({ queryKey: ['applications'] });
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
          <DialogTitle>{isEdit ? 'Edit application' : 'Log an application'}</DialogTitle>
          <DialogDescription>Track where each application stands.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Job">
            <select {...register('jobId')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
              <option value="">None (enter manually below)</option>
              {jobs?.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.companyName ?? 'No company'}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Role title">
              <Input placeholder="Senior Frontend Engineer" {...register('roleTitle')} />
            </Field>
            <Field label="Company name">
              <Input placeholder="Northwind AI" {...register('companyName')} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                {...register('status', { onChange: (e) => setStatus(e.target.value) })}
                className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none"
              >
                {(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const).map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Applied on">
              <Input type="date" {...register('appliedAt')} />
            </Field>
          </div>
          <Field label="Notes">
            <Textarea className="min-h-[70px]" placeholder="Recruiter contact, process, follow-ups…" {...register('notes')} />
          </Field>
          <Field label="Source">
            <select {...register('source')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
              <option value="">—</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Company site">Company site</option>
              <option value="Referral">Referral</option>
              <option value="Recruiter">Recruiter</option>
              <option value="Job board">Job board</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          {isEdit ? <AttachmentList entity="application" id={application?.id ?? null} /> : null}

          {status === 'OFFER' ? (
            <div className="rounded-[var(--radius-control)] border border-accent-border bg-accent-muted p-3">
              <p className="mb-3 text-[12px] font-medium text-text-secondary">Offer details</p>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Amount">
                  <Input type="number" placeholder="180000" {...register('offerAmount')} />
                </Field>
                <Field label="Currency">
                  <Input placeholder="USD" {...register('offerCurrency')} />
                </Field>
                <Field label="Per">
                  <select {...register('offerFrequency')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                    {['YEARLY', 'MONTHLY', 'HOURLY'].map((f) => (
                      <option key={f} value={f}>
                        {f.toLowerCase()}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="mt-3">
                <Field label="Offer status">
                  <select {...register('offerStatus')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
                    <option value="">—</option>
                    {['PENDING', 'NEGOTIATING', 'ACCEPTED', 'DECLINED'].map((s) => (
                      <option key={s} value={s}>
                        {TitleCase(s)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Offer notes" className="mt-3">
                  <Textarea className="min-h-[60px]" placeholder="Equity, sign-on, negotiations, deadline…" {...register('offerNotes')} />
                </Field>
              </div>
            </div>
          ) : null}

          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Log application'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
