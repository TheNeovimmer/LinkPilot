import { env } from '../../config/env';
import { prisma } from '../../database/prisma';
import type { Prisma } from '@prisma/client';
import { AiClient } from './client';

/**
 * Resolved, per-user AI provider config.
 * User settings (stored in Profile.preferences.ai) override environment
 * defaults, so the endpoint can be configured from Settings without touching
 * `.env`. The API key is persisted server-side only and never returned to the
 * browser unmasked.
 */
export interface AiRuntimeConfig {
  baseUrl: string;
  model: string;
  embeddingModel: string | null;
  apiKey: string;
  enabled: boolean;
}

export interface PersistedAiSettings {
  baseUrl?: string;
  model?: string;
  embeddingModel?: string | null;
  apiKey?: string;
  enabled?: boolean;
}

/** Which keys are not secrets and safe to expose in a masked settings response. */
export interface AiSettingsView {
  baseUrl: string;
  model: string;
  embeddingModel: string | null;
  enabled: boolean;
  hasApiKey: boolean;
  /** e.g. "sk-…3fA9" — enough to confirm what's stored, never the full key. */
  apiKeyHint: string | null;
}

export function maskApiKey(apiKey: string | null | undefined): string | null {
  if (!apiKey) return null;
  if (apiKey.length <= 6) return '••••••';
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`;
}

/** Read the user's persisted AI settings from their profile preferences. */
export async function readAiSettings(userId: string): Promise<PersistedAiSettings> {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { preferences: true } });
  const ai = (profile?.preferences as { ai?: PersistedAiSettings } | null)?.ai;
  return ai ?? {};
}

/** Sparse update that only overwrites fields present in `patch`. */
export async function writeAiSettings(userId: string, patch: PersistedAiSettings): Promise<void> {
  const current = await readAiSettings(userId);
  // An empty-string apiKey means "leave unchanged" (the UI only ever sees a
  // masked hint, never the raw key).
  const apiKey =
    patch.apiKey !== undefined && patch.apiKey !== '' ? patch.apiKey : current.apiKey;
  const next: PersistedAiSettings = {
    ...current,
    ...patch,
    apiKey,
  };
  const json = JSON.parse(JSON.stringify({ ai: next })) as Prisma.InputJsonValue;
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, preferences: json },
    update: { preferences: json },
  });
}

/** Merge persisted user settings over environment defaults. */
export async function resolveAiConfig(userId: string): Promise<AiRuntimeConfig> {
  const s = await readAiSettings(userId);
  const apiKey = s.apiKey !== undefined ? s.apiKey : env.AI_API_KEY ?? '';
  const baseUrl = (s.baseUrl ?? env.AI_BASE_URL).replace(/\/+$/, '');
  return {
    baseUrl,
    model: s.model ?? env.AI_MODEL,
    embeddingModel: s.embeddingModel !== undefined ? s.embeddingModel : env.AI_EMBEDDING_MODEL ?? null,
    apiKey,
    enabled: s.enabled ?? Boolean(apiKey),
  };
}

/** Build a fully-configured AI client for a specific user. */
export async function getAiClient(userId: string): Promise<AiClient> {
  const cfg = await resolveAiConfig(userId);
  return new AiClient(cfg);
}

/** Public, safe-to-send view of a user's AI config (key is masked). */
export async function getAiSettingsView(userId: string): Promise<AiSettingsView> {
  const cfg = await resolveAiConfig(userId);
  return {
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    embeddingModel: cfg.embeddingModel,
    enabled: cfg.enabled,
    hasApiKey: Boolean(cfg.apiKey),
    apiKeyHint: maskApiKey(cfg.apiKey) ?? null,
  };
}
