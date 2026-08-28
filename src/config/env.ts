import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from the repo root (and the current working dir as a fallback).
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  /** Public URL of the app (used for auth links / cookies behind a proxy). */
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DATABASE?sslmode=require'),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16)
    .default('linkpilot-dev-secret-change-me-0000000000000000'),
  /** OpenAI-compatible endpoint. OpenCode Zen free models work out of the box. */
  AI_BASE_URL: z.string().url().default('https://opencode.ai/zen/v1'),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default('deepseek-v4-flash-free'),
  /** Optional embedding model id (e.g. text-embedding-3-small) for semantic job search. */
  AI_EMBEDDING_MODEL: z.string().optional(),
  /** AI streaming request timeout (ms). */
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),
  UPLOAD_DIR: z.string().default('uploads'),
  TRUST_PROXY: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
