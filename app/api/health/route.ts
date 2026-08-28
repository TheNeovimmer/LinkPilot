import { prisma } from '@/database/prisma';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: 'ok', db: 'up', uptime: process.uptime(), timestamp: new Date().toISOString() });
  } catch (err) {
    return Response.json({ status: 'degraded', uptime: process.uptime(), timestamp: new Date().toISOString() }, { status: 503 });
  }
}
