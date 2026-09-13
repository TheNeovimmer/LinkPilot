import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/modules/auth/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const { GET: _GET, POST: _POST } = toNextJsHandler(auth);

// ponytail: Better Auth throws Prisma init errors uncaught -> Vercel empty 500. Return JSON instead.
async function withJsonErrors(fn: (req: Request) => Promise<Response>, req: Request): Promise<Response> {
  try {
    return await fn(req);
  } catch (err) {
    console.error('auth handler failed', err);
    return Response.json({ success: false, error: { code: 'INTERNAL', message: 'Internal server error' } }, { status: 500 });
  }
}

export function GET(req: Request): Promise<Response> {
  return withJsonErrors(_GET, req);
}

export function POST(req: Request): Promise<Response> {
  return withJsonErrors(_POST, req);
}
