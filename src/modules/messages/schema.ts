import { z } from 'zod';

export const messageIdParamsSchema = z.object({
  conversationId: z.string().min(4).max(64),
  id: z.string().min(4).max(64),
});

export const messageListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  role: z.enum(['ME', 'THEM', 'AI']).optional(),
  /** Load messages older than this timestamp (cursor for "load earlier"). */
  before: z.string().datetime().optional(),
});

export const createMessageSchema = z.object({
  role: z.enum(['ME', 'THEM']),
  content: z.string().trim().min(1).max(20_000),
});

export const replaceMessageSchema = z.object({
  role: z.enum(['ME', 'THEM']).optional(),
  content: z.string().trim().min(1).max(20_000),
});
