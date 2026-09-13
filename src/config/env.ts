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
  /** Max AI calls per workspace per hour (sliding window, per-process). */
  AI_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(60),
  TRUST_PROXY: z.coerce.boolean().default(true),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

// Prod misconfig must not crash the serverless instance (process.exit = HTML /500 on Vercel).
// Log once; auth/DB calls will surface the real error in Runtime Logs.
if (env.NODE_ENV === 'production') {
  const problems: string[] = [];
  if (env.BETTER_AUTH_URL.includes('localhost')) problems.push('BETTER_AUTH_URL must be the public https URL (e.g. https://thelink-pilot.vercel.app)');
  if (env.DATABASE_URL.includes('USER:PASSWORD@HOST')) problems.push('DATABASE_URL is a placeholder');
  if (env.BETTER_AUTH_SECRET.includes('change-me') || env.BETTER_AUTH_SECRET.length < 32)
    problems.push('BETTER_AUTH_SECRET must be a real 32+ char secret');
  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid production env:', problems.join('; '));
  }
}

export type Env = typeof env;
