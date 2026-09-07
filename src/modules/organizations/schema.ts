import { z } from 'zod';
import { ORG_ROLES } from '../rbac/roles';

export const createOrgSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(60).regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers, dashes only'),
});

export const updateOrgSchema = z.object({
  name: z.string().min(2).max(80).optional(),
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(ORG_ROLES).default('MEMBER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(ORG_ROLES),
});

export const orgIdSchema = z.object({ id: z.string().min(1) });
