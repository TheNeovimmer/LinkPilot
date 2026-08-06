import { z } from 'zod';
import { urlField } from '../../utils/url.js';

export const recruiterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  status: z
    .enum(['NEW', 'CONTACTED', 'RESPONDED', 'INTERVIEW_SCHEDULED', 'OFFER', 'REJECTED', 'INACTIVE'])
    .optional(),
  companyId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'lastContactAt']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const recruiterIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createRecruiterSchema = z.object({
  name: z.string().trim().min(1).max(200),
  companyId: z.string().optional(),
  title: z.string().trim().max(200).optional(),
  linkedinUrl: urlField,
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  phone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(5000).optional(),
  status: z.enum(['NEW', 'CONTACTED', 'RESPONDED', 'INTERVIEW_SCHEDULED', 'OFFER', 'REJECTED', 'INACTIVE']).optional(),
  lastContactAt: z.string().datetime().optional().nullable(),
});

export const updateRecruiterSchema = createRecruiterSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
