import { prisma } from './src/database/prisma';
import { auth } from './src/modules/auth/auth';
(async () => {
  const email = 'demo@linkpilot.app';
  const password = 'linkpilot-demo-1234';
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const su = await auth.api.signUpEmail({ body: { email, password, name: 'Alex Rivera' } });
    console.log('created demo user', su.user?.id);
  } else {
    // Delete + recreate to refresh the password hash under current better-auth.
    await prisma.user.delete({ where: { email } });
    const su = await auth.api.signUpEmail({ body: { email, password, name: 'Alex Rivera' } });
    console.log('recreated demo user', su.user?.id);
  }
  await prisma.$disconnect();
})();
