import path from 'node:path';
import { requireUser } from '@/server/http';
import { handle } from '@/server/http';

/** Serve uploads from the database (attachments + avatars), scope-gated.
 * Legacy on-disk files under UPLOAD_DIR are served only when the caller
 * can see the owning row, then should be migrated via scripts/migrate-uploads-to-db.ts.
 */
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { resolveDataScope } = await import('@/server/scope');
    const scope = await resolveDataScope(req, user);
    const { path: segments } = await ctx.params;
    const filename = path.basename(segments.join('/'));
    if (!filename || filename.includes('\u0000')) return new Response('Not found', { status: 404 });

    const [{ AttachmentService }, { AttachmentRepository }] = await Promise.all([
      import('@/modules/attachments/service'),
      import('@/modules/attachments/repository'),
    ]);
    const service = new AttachmentService(new AttachmentRepository());
    const file = await service.findFile(scope, filename);
    if (file) {
      return new Response(new Uint8Array(file.data), {
        headers: { 'Content-Type': file.mimeType || 'application/octet-stream', 'Cache-Control': 'private, max-age=3600' },
      });
    }

    const { prisma } = await import('@/database/prisma');
    const url = `/uploads/${filename}`;
    const avatarOwner = await prisma.user.findFirst({
      where: { image: url },
      select: { id: true, avatarData: true, avatarMime: true },
    });
    if (avatarOwner?.avatarData) {
      return new Response(new Uint8Array(avatarOwner.avatarData), {
        headers: { 'Content-Type': avatarOwner.avatarMime || 'image/png', 'Cache-Control': 'private, max-age=3600' },
      });
    }

    // Legacy fallback: on-disk file, served only when the caller owns the row.
    const [{ AttachmentRepository: Repo2 }] = await Promise.all([import('@/modules/attachments/repository')]);
    const legacyRepo = new Repo2();
    const row = await legacyRepo.findById(scope, (await legacyLookupId(scope, filename)) ?? '__none__').catch(() => null);
    const isLegacyAvatar = avatarOwner && !avatarOwner.avatarData;
    if (!row && !isLegacyAvatar) return new Response('Not found', { status: 404 });
    try {
      const { readFile } = await import('node:fs/promises');
      const { getUploadRoot } = await import('@/lib/storage');
      const root = getUploadRoot();
      const filePath = path.join(root, filename);
      if (!filePath.startsWith(root + path.sep)) return new Response('Not found', { status: 404 });
      const buf = await readFile(filePath);
      const ext = path.extname(filename).toLowerCase();
      const type = ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' } as Record<string, string>)[ext] ?? 'application/octet-stream';
      return new Response(new Uint8Array(buf), {
        headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=3600' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

async function legacyLookupId(scope: { userId: string; orgId: string }, filename: string): Promise<string | null> {
  const { prisma } = await import('@/database/prisma');
  const { scopeAndWhere } = await import('@/server/scope');
  const hit = await prisma.attachment.findFirst({
    where: scopeAndWhere(scope, { filename }),
    select: { id: true },
  });
  return hit?.id ?? null;
}
