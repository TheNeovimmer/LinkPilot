import { z } from 'zod';

export const draftReplySchema = z.object({
  conversationId: z.string().min(4).max(64),
  extraContext: z.string().trim().max(2000).optional(),
  tone: z.string().trim().max(100).optional(),
});

export const rewriteSchema = z.object({
  text: z.string().trim().min(1).max(20_000),
  tone: z.string().trim().max(100).optional(),
  instruction: z.string().trim().max(1000).optional(),
});

export const analyzeJobSchema = z.object({
  jobId: z.string().min(4).max(64),
});

export const interviewPrepSchema = z.object({
  interviewId: z.string().min(4).max(64),
});

export const summarizeSchema = z.object({
  conversationId: z.string().min(4).max(64),
});

/**
 * Per-user AI provider settings. All fields optional — on update only the
 * fields present are persisted (sparse patch). `apiKey` may be sent as an
 * empty string to keep it unchanged.
 */
export const updateAiSettingsSchema = z
  .object({
    baseUrl: z.string().trim().url().max(500).optional(),
    model: z.string().trim().min(1).max(200).optional(),
    embeddingModel: z.string().trim().min(1).max(200).nullable().optional(),
    apiKey: z.string().trim().max(1000).optional(),
    enabled: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'At least one field must be provided',
  });
