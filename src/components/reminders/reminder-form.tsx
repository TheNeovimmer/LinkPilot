import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/common/field';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  dueAt: z.string().min(1, 'Date & time required'),
  body: z.string().max(5000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

export function ReminderFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', dueAt: '', body: '' },
  });

  useEffect(() => {
    if (open) {
      const d = new Date(Date.now() + 86_400_000);
      const p = (n: number) => String(n).padStart(2, '0');
      reset({ title: '', dueAt: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`, body: '' });
    }
  }, [open, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post('/reminders', { title: values.title, dueAt: new Date(values.dueAt).toISOString(), body: values.body || undefined });
      queryClient.invalidateQueries({ queryKey: ['reminders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Reminder set');
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New reminder</DialogTitle>
          <DialogDescription>You will get a notification when it is due.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="Follow up on application" {...register('title')} />
          </Field>
          <Field label="Due" error={errors.dueAt?.message}>
            <Input type="datetime-local" {...register('dueAt')} />
          </Field>
          <Field label="Details">
            <Input placeholder="Optional note" {...register('body')} />
          </Field>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Set reminder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
