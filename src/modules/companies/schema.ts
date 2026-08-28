import { z } from 'zod';
import { urlField } from '../../utils/url';

export const companyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  industry: z.string().trim().max(100).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const companyIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createCompanySchema = z.object({
  name: z.string().trim().min(1).max(200),
  industry: z.string().trim().max(100).optional(),
  website: urlField,
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

export const updateCompanySchema = createCompanySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
