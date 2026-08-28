import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getUploadRoot } from '@/lib/storage';

/** Serve user-uploaded files from UPLOAD_DIR (avatars, attachment downloads). */
export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await ctx.params;
  const root = getUploadRoot();
  const filePath = path.join(/* turbopackIgnore: true */ root, ...segments);
  if (!filePath.startsWith(root + path.sep) && filePath !== root) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return new Response('Not found', { status: 404 });
    const buf = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }[ext] ?? 'application/octet-stream';
    return new Response(new Uint8Array(buf), {
      headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=604800' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
