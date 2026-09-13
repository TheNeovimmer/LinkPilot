import { requireUser } from '@/server/http';
import { handle } from '@/server/http';

/** Serve uploads from the database (attachments + avatars), scope-gated. No filesystem. */
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    const user = await requireUser(req);
    const { resolveDataScope } = await import('@/server/scope');
    const scope = await resolveDataScope(req, user);
    const { path: segments } = await ctx.params;
    const filename = segments.join('/').split('/').pop() ?? '';
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

    return new Response('Not found', { status: 404 });
  });
}
