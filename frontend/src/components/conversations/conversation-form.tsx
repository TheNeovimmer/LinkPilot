import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useEffect } from 'react';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { toast } from 'sonner';
import type { Conversation } from '@/types';

const schema = z.object({
  contactName: z.string().min(1, 'Contact name is required').max(200),
  contactHeadline: z.string().max(300).optional().or(z.literal('')),
  contactLinkedInUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  recruiterId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ConversationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this conversation instead of creating. */
  conversation?: Conversation | null;
}

export function ConversationForm({ open, onOpenChange, conversation }: ConversationFormProps) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(conversation);

  const { data: companies } = useQuery({
    queryKey: ['companies', 'all'],
    queryFn: async () => (await api.get('/companies/all')).data.data as { id: string; name: string }[],
  });
  const { data: recruiters } = useQuery({
    queryKey: ['recruiters', 'all'],
    queryFn: async () => (await api.get('/recruiters', { params: { limit: 100 } })).data.data as { id: string; name: string; companyName: string | null }[],
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { contactName: '', contactHeadline: '', contactLinkedInUrl: '', companyId: '', recruiterId: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        contactName: conversation?.contactName ?? '',
        contactHeadline: conversation?.contactHeadline ?? '',
        contactLinkedInUrl: conversation?.contactLinkedInUrl ?? '',
        companyId: conversation?.companyId ?? '',
        recruiterId: conversation?.recruiterId ?? '',
        notes: '',
      });
    }
  }, [open, conversation, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      contactName: values.contactName,
      contactHeadline: values.contactHeadline || undefined,
      contactLinkedInUrl: values.contactLinkedInUrl || undefined,
      companyId: values.companyId || undefined,
      recruiterId: values.recruiterId || undefined,
    };
    try {
      if (isEdit) {
        await api.patch(`/conversations/${conversation!.id}`, payload);
        toast.success('Conversation updated');
      } else {
        await api.post('/conversations', payload);
        toast.success('Conversation created');
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
          <DialogTitle>{isEdit ? 'Edit conversation' : 'New conversation'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update contact details.' : 'Track a recruiter or hiring contact you are talking to.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Contact name" error={errors.contactName?.message}>
            <Input placeholder="Priya Nair" {...register('contactName')} />
          </Field>
          <Field label="Headline" error={errors.contactHeadline?.message}>
            <Input placeholder="Talent Partner at Northwind AI" {...register('contactHeadline')} />
          </Field>
          <Field label="LinkedIn profile URL" error={errors.contactLinkedInUrl?.message}>
            <Input placeholder="https://linkedin.com/in/…" {...register('contactLinkedInUrl')} />
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
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Create conversation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
