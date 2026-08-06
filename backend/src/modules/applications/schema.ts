import { z } from 'zod';

export const applicationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  jobId: z.string().optional(),
  q: z.string().trim().max(300).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'appliedAt', 'companyName']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const applicationIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createApplicationSchema = z.object({
  jobId: z.string().optional().nullable(),
  companyName: z.string().trim().max(200).optional().nullable(),
  roleTitle: z.string().trim().max(300).optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  appliedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(10_000).optional().nullable(),
  coverLetter: z.string().trim().max(20_000).optional().nullable(),
});

export const updateApplicationSchema = createApplicationSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });

export const bulkApplicationSchema = z.object({
  ids: z.array(z.string().min(4).max(64)).min(1).max(200),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN']),
});
