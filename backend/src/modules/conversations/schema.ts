import { z } from 'zod';
import { urlField } from '../../utils/url.js';

export const conversationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(200).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  recruiterId: z.string().optional(),
  companyId: z.string().optional(),
  sortBy: z.enum(['updatedAt', 'createdAt', 'lastMessageAt', 'contactName']).default('updatedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const conversationIdSchema = z.object({
  id: z.string().min(4).max(64),
});

export const createConversationSchema = z.object({
  contactName: z.string().trim().min(1).max(200),
  contactLinkedInUrl: urlField,
  contactHeadline: z.string().trim().max(300).optional(),
  companyId: z.string().optional(),
  recruiterId: z.string().optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  pinned: z.boolean().optional(),
});

export const updateConversationSchema = createConversationSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'At least one field required' });
