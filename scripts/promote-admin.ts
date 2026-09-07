import { prisma } from '../src/database/prisma';

async function main(): Promise<void> {
  const arg = process.argv[2]?.toLowerCase();
  if (!arg) {
    console.error('Usage: npx tsx scripts/promote-admin.ts you@company.com | --list');
    process.exit(1);
  }

  try {
    if (arg === '--list') {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'asc' },
        select: { email: true, name: true, platformRole: true },
      });
      for (const u of users) console.log(`${u.platformRole}\t${u.email}\t${u.name ?? ''}`);
      return;
    }

    const user = await prisma.user.update({
      where: { email: arg },
      data: { platformRole: 'SUPER_ADMIN' },
      select: { id: true, email: true, platformRole: true },
    });
    console.log(`Promoted ${user.email} to ${user.platformRole}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
