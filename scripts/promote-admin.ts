import { prisma } from '../src/database/prisma';

const email = process.argv[2]?.toLowerCase();
if (!email) {
  console.error('Usage: npx tsx scripts/promote-admin.ts you@company.com');
  process.exit(1);
}

const user = await prisma.user.update({
  where: { email },
  data: { platformRole: 'SUPER_ADMIN' },
  select: { id: true, email: true, platformRole: true },
});
console.log(`Promoted ${user.email} to ${user.platformRole}`);
await prisma.$disconnect();
