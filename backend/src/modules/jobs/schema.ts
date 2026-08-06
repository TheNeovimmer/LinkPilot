import { z } from 'zod';

export const jobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(300).optional(),
  status: z.enum(['WATCHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'CLOSED']).optional(),
  companyId: z.string().optional(),
  remote: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fitScore', 'title', 'salaryMax']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const jobIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createJobSchema = z.object({
  title: z.string().trim().min(1).max(300),
  companyId: z.string().optional(),
  url: z.string().url().optional().or(z.literal('').transform(() => undefined)),
  description: z.string().trim().max(50_000).optional(),
  location: z.string().trim().max(200).optional(),
  remote: z.boolean().optional(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  status: z.enum(['WATCHLIST', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'CLOSED']).optional(),
  postedAt: z.string().datetime().optional().nullable(),
});

export const updateJobSchema = createJobSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const semanticSearchSchema = z.object({
  q: z.string().trim().min(2).max(500),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});
