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
import { RECRUITER_STATUS_META } from '@/components/common/status-badge';
import { useLocale } from '@/stores/locale';
import { toast } from 'sonner';
import type { Recruiter } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  title: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(40).optional().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  status: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function RecruiterFormDialog({
  open,
  onOpenChange,
  recruiter,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recruiter: Recruiter | null;
}) {
  const t = useLocale((s) => s.t);
  const queryClient = useQueryClient();
  const isEdit = Boolean(recruiter);
  const { data: companies } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: async () => (await api.get('/companies/all')).data.data as { id: string; name: string }[],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', title: '', email: '', phone: '', linkedinUrl: '', companyId: '', status: 'NEW' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: recruiter?.name ?? '',
        title: recruiter?.title ?? '',
        email: recruiter?.email ?? '',
        phone: recruiter?.phone ?? '',
        linkedinUrl: recruiter?.linkedinUrl ?? '',
        companyId: recruiter?.companyId ?? '',
        status: recruiter?.status ?? 'NEW',
      });
    }
  }, [open, recruiter, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      title: values.title || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      linkedinUrl: values.linkedinUrl || undefined,
      companyId: values.companyId || undefined,
    };
    try {
      if (isEdit) {
        await api.patch(`/recruiters/${recruiter!.id}`, payload);
        toast.success('Recruiter updated');
      } else {
        await api.post('/recruiters', payload);
        toast.success('Recruiter added');
      }
      queryClient.invalidateQueries({ queryKey: ['recruiters'] });
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
          <DialogTitle>{isEdit ? 'Edit recruiter' : 'Add a recruiter'}</DialogTitle>
          <DialogDescription>Keep your contact's details and where the relationship stands.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Priya Nair" {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Title">
              <Input placeholder="Talent Partner" {...register('title')} />
            </Field>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="priya@company.com" {...register('email')} />
            </Field>
            <Field label="Phone">
              <Input placeholder="+1 555 000 1234" {...register('phone')} />
            </Field>
          </div>
          <Field label="LinkedIn URL" error={errors.linkedinUrl?.message}>
            <Input placeholder="https://linkedin.com/in/…" {...register('linkedinUrl')} />
          </Field>
          <Field label="Status">
            <select {...register('status')} className="h-9 w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 text-sm text-text focus:border-accent-border focus:outline-none">
              {Object.entries(RECRUITER_STATUS_META).map(([value, meta]) => (
                <option key={value} value={value}>
                  {t(meta.labelKey)}
                </option>
              ))}
            </select>
          </Field>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add recruiter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
