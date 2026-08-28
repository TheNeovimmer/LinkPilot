import { z } from 'zod';

export const interviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).optional(),
  mode: z.enum(['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL']).optional(),
  jobId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'updatedAt']).default('scheduledAt'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export const interviewIdSchema = z.object({ id: z.string().min(4).max(64) });

export const createInterviewSchema = z.object({
  title: z.string().trim().min(1).max(300),
  scheduledAt: z.string().datetime(),
  durationMin: z.number().int().min(5).max(480).default(45),
  mode: z.enum(['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL']).default('VIDEO'),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']).default('SCHEDULED'),
  jobId: z.string().optional().nullable(),
  applicationId: z.string().optional().nullable(),
  recruiterId: z.string().optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  feedback: z.string().trim().max(5000).optional().nullable(),
});

export const updateInterviewSchema = createInterviewSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
