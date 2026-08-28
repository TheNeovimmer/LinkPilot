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
