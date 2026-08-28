import { z } from 'zod';

export const noteQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  tag: z.string().trim().max(50).optional(),
  pinned: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const noteIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().max(50_000).optional().nullable(),
  pinned: z.boolean().optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
});

export const updateNoteSchema = createNoteSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
