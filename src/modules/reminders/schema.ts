import { z } from 'zod';

export const reminderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  done: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  dueBefore: z.string().datetime().optional(),
  sortBy: z.enum(['dueAt', 'createdAt', 'updatedAt']).default('dueAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const reminderIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createReminderSchema = z.object({
  title: z.string().trim().min(1).max(300),
  body: z.string().trim().max(5000).optional().nullable(),
  dueAt: z.string().datetime(),
  done: z.boolean().optional(),
});

export const updateReminderSchema = createReminderSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
