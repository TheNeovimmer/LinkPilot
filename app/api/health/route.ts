import { prisma } from '@/database/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', db: 'up', uptime: process.uptime(), timestamp: new Date().toISOString() });
  } catch (err) {
    // ponytail: expose code only (no connection string) so prod DB misconfig is diagnosable.
    const code = err instanceof Error ? err.name : 'Unknown';
    return Response.json({ status: 'degraded', db: 'down', code, uptime: process.uptime(), timestamp: new Date().toISOString() }, { status: 503 });
  }
}
