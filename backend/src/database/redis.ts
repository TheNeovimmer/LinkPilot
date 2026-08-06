import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis: Redis =
  globalForRedis.redis ?? new Redis(env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

let connected = false;

export async function connectRedis(): Promise<void> {
  if (connected) return;
  try {
    await redis.connect();
    connected = true;
    logger.info('Redis connected');
  } catch (err) {
    // Cache is best-effort: the app must still run without Redis.
    logger.warn(`Redis unavailable (${(err as Error).message}) — caching disabled`);
  }
}

/** Get a JSON value from cache, or null on miss/error. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Set a JSON value in cache (best-effort, honors TTL). */
export async function cacheSet(key: string, value: unknown, ttl = env.REDIS_CACHE_TTL): Promise<void> {
  try {
    if (ttl > 0) await redis.set(key, JSON.stringify(value), 'EX', ttl);
  } catch {
    /* cache is best-effort */
  }
}

/** Invalidate one or more cache keys. */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    if (keys.length) await redis.del(keys);
  } catch {
    /* best-effort */
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === 'ready') await redis.quit();
}
