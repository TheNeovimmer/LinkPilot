import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(120).optional(),
  title: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(120).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal('').transform(() => null)),
  tone: z.enum(['professional', 'casual', 'confident', 'concise']).optional(),
  goals: z
    .object({
      targetRole: z.string().max(300).optional(),
      industries: z.array(z.string().max(100)).optional(),
      salaryRange: z.string().max(100).optional(),
      priorities: z.array(z.string().max(200)).optional(),
    })
    .optional()
    .nullable(),
  preferences: z.record(z.unknown()).optional(),
});
