import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { toast } from 'sonner';
import type { Company } from '@/types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  industry: z.string().max(120).optional().or(z.literal('')),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function CompanyFormDialog({
  open,
  onOpenChange,
  company,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  company: Company | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(company);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', industry: '', website: '', location: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: company?.name ?? '',
        industry: company?.industry ?? '',
        website: company?.website ?? '',
        location: company?.location ?? '',
        notes: company?.notes ?? '',
      });
    }
  }, [open, company, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      industry: values.industry || undefined,
      website: values.website || undefined,
      location: values.location || undefined,
      notes: values.notes || undefined,
    };
    try {
      if (isEdit) {
        await api.patch(`/companies/${company!.id}`, payload);
        toast.success('Company updated');
      } else {
        await api.post('/companies', payload);
        toast.success('Company added');
      }
      queryClient.invalidateQueries({ queryKey: ['companies'] });
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
          <DialogTitle>{isEdit ? 'Edit company' : 'Add a company'}</DialogTitle>
          <DialogDescription>Track the organizations behind your job search.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Name" error={errors.name?.message}>
            <Input placeholder="Acme Inc." {...register('name')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Industry">
              <Input placeholder="Fintech" {...register('industry')} />
            </Field>
            <Field label="Location">
              <Input placeholder="Berlin, Germany" {...register('location')} />
            </Field>
          </div>
          <Field label="Website" error={errors.website?.message}>
            <Input placeholder="https://acme.com" {...register('website')} />
          </Field>
          <Field label="Notes">
            <Textarea rows={3} placeholder="Products, team size, anything relevant…" {...register('notes')} />
          </Field>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Add company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
