import { useEffect, useState } from 'react';
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
import type { Note } from '@/types';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(300),
  content: z.string().max(50_000).optional().or(z.literal('')),
  tags: z.string().max(400).optional(),
});

type FormValues = z.infer<typeof schema>;

export function NoteFormDialog({
  open,
  onOpenChange,
  note,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  note: Note | null;
}) {
  const queryClient = useQueryClient();
  const isEdit = Boolean(note);
  const [pinned, setPinned] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', content: '', tags: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: note?.title ?? '',
        content: note?.content ?? '',
        tags: note?.tags?.join(', ') ?? '',
      });
      setPinned(note?.pinned ?? false);
    }
  }, [open, note, reset]);

  const onSubmit = async (values: FormValues) => {
    const tags = (values.tags ?? '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20);
    try {
      if (isEdit) {
        await api.patch(`/notes/${note!.id}`, { ...values, tags, pinned });
        toast.success('Note updated');
      } else {
        await api.post('/notes', { ...values, tags, pinned });
        toast.success('Note saved');
      }
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit note' : 'New note'}</DialogTitle>
          <DialogDescription>Keep context close — takeaways, research, follow-ups.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field label="Title" error={errors.title?.message}>
            <Input placeholder="Takeaways from round 1" {...register('title')} />
          </Field>
          <Field label="Content">
            <Textarea className="min-h-[160px]" placeholder="What do you want to remember?" {...register('content')} />
          </Field>
          <Field label="Tags" hint="Comma separated">
            <Input placeholder="company, salary, culture" {...register('tags')} />
          </Field>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-text-secondary">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="h-4 w-4 rounded border-border bg-surface-2 accent-[#3ddc97]" />
            Pin to top
          </label>
          <DialogFooter className="mt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isEdit ? 'Save changes' : 'Save note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
