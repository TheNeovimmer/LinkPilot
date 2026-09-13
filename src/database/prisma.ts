import { PrismaClient } from '@prisma/client';

// Single Prisma instance shared across the app (dev hot-reload safe).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// ponytail: always cache on globalThis — serverless must reuse the pool or Neon hits limit 13.
globalForPrisma.prisma = prisma;
