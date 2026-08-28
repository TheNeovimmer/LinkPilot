import path from 'node:path';
import fs from 'node:fs';
import { env } from '@/config/env';

/**
 * Central store for user-uploaded files (avatars, application attachments).
 *
 * All filesystem access lives here so Next/Turbopack only needs to trace the
 * upload subfolder instead of the whole project. Every fs path is wrapped in a
 * `turbopackIgnore` directive: dynamic filesystem access in a route handler
 * otherwise makes Next trace *everything* into the serverless bundle, which
 * blows up Vercel deployment size/time.
 *
 * An absolute `UPLOAD_DIR` is honored for self-hosting on a persistent volume;
 * a relative one is resolved against the app root (`process.cwd()`).
 */
function uploadRoot(): string {
  return path.resolve(/* turbopackIgnore: true */ process.cwd(), env.UPLOAD_DIR);
}

/** Resolve the upload root (shared with the `/uploads` serving route). */
export function getUploadRoot(): string {
  return uploadRoot();
}

/** Ensure the upload root exists (idempotent). Call before writing. */
export function ensureUploadDir(): void {
  fs.mkdirSync(path.join(/* turbopackIgnore: true */ uploadRoot()), { recursive: true });
}

/** Write a buffer to the upload root. `filename` is sanitised to its basename. */
export function writeUpload(filename: string, data: Buffer): string {
  const resolved = path.join(/* turbopackIgnore: true */ uploadRoot(), path.basename(filename));
  fs.writeFileSync(resolved, data);
  return resolved;
}

/** Delete a file under the upload root. Safe no-op if it's missing or outside the root. */
export function removeUpload(filename: string): boolean {
  const abs = path.resolve(/* turbopackIgnore: true */ uploadRoot(), path.basename(filename));
  if (!abs.startsWith(uploadRoot() + path.sep)) return false;
  try {
    fs.unlinkSync(abs);
    return true;
  } catch {
    return false;
  }
}