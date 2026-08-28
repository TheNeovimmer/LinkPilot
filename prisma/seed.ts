/**
 * Idempotent seed: creates the demo user (via Better Auth so passwords hash
 * correctly) and a realistic dataset. Safe to re-run.
 *
 *   npm run db:seed -w backend
 */
import { auth } from '../src/modules/auth/auth.js';
import { prisma } from '../src/database/prisma.js';
import { logger } from '../src/utils/logger.js';

const SEED_EMAIL = process.env.SEED_EMAIL ?? 'demo@linkpilot.app';
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'linkpilot-demo-1234';

async function ensureUser(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: SEED_EMAIL } });
  if (existing) return existing.id;

  const signedUp = await auth.api.signUpEmail({
    body: {
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: 'Alex Rivera',
    },
  });
  if (!signedUp.user?.id) throw new Error('Sign-up failed');
  logger.info(`Created demo user ${SEED_EMAIL}`);
  return signedUp.user.id;
}

async function main(): Promise<void> {
  const userId = await ensureUser();

  await prisma.profile.upsert({
    where: { userId },
    create: {
      userId,
      displayName: 'Alex Rivera',
      title: 'Senior Full-Stack Engineer',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/alexrivera',
      tone: 'professional',
      goals: {
        targetRole: 'Staff Software Engineer (or senior IC) at a growth-stage company',
        industries: ['developer tools', 'AI infrastructure', 'fintech'],
        salaryRange: '$240k - $320k total comp',
        priorities: ['ownership', 'remote-friendly', 'learning budget'],
      },
    },
    update: {},
  });

  const [acme, northwind, figment] = await Promise.all([
    prisma.company.upsert({ where: { id: 'cmp_acme' }, create: { id: 'cmp_acme', userId, name: 'Acme Cloud', industry: 'developer tools', location: 'Remote', website: 'https://acme.example' }, update: { userId } }),
    prisma.company.upsert({ where: { id: 'cmp_northwind' }, create: { id: 'cmp_northwind', userId, name: 'Northwind AI', industry: 'AI infrastructure', location: 'New York, NY', website: 'https://northwind.example' }, update: { userId } }),
    prisma.company.upsert({ where: { id: 'cmp_figment' }, create: { id: 'cmp_figment', userId, name: 'Figment Labs', industry: 'fintech', location: 'Austin, TX', website: 'https://figment.example' }, update: { userId } }),
  ]);

  const [dana, priya, marcus] = await Promise.all([
    prisma.recruiter.upsert({
      where: { id: 'rec_dana' },
      create: { id: 'rec_dana', userId, name: 'Dana Whitfield', companyId: acme.id, title: 'Senior Technical Recruiter', email: 'dana@acme.example', status: 'CONTACTED', lastContactAt: new Date(Date.now() - 2 * 86_400_000) },
      update: { userId },
    }),
    prisma.recruiter.upsert({
      where: { id: 'rec_priya' },
      create: { id: 'rec_priya', userId, name: 'Priya Nair', companyId: northwind.id, title: 'Talent Partner', email: 'priya@northwind.example', status: 'INTERVIEW_SCHEDULED', lastContactAt: new Date(Date.now() - 86_400_000) },
      update: { userId },
    }),
    prisma.recruiter.upsert({
      where: { id: 'rec_marcus' },
      create: { id: 'rec_marcus', userId, name: 'Marcus Lee', companyId: figment.id, title: 'Engineering Recruiter', status: 'NEW' },
      update: { userId },
    }),
  ]);

  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'job_sre' },
      create: {
        id: 'job_sre', userId, companyId: northwind.id,
        title: 'Senior Platform Engineer', url: 'https://northwind.example/careers/platform',
        description: 'Build and scale our inference platform. Kubernetes, Go, PostgreSQL at 10k QPS.',
        location: 'New York, NY', remote: true, salaryMin: 230_000, salaryMax: 300_000,
        status: 'INTERVIEWING', fitScore: 88, postedAt: new Date(Date.now() - 20 * 86_400_000),
      },
      update: { userId },
    }),
    prisma.job.upsert({
      where: { id: 'job_em' },
      create: {
        id: 'job_em', userId, companyId: acme.id,
        title: 'Engineering Manager, Developer Experience', url: 'https://acme.example/careers/em-dx',
        description: 'Lead a team of 6 building our CLI and SDK. 40% people, 60% technical.',
        location: 'Remote', remote: true, salaryMin: 250_000, salaryMax: 320_000,
        status: 'WATCHLIST', postedAt: new Date(Date.now() - 5 * 86_400_000),
      },
      update: { userId },
    }),
    prisma.job.upsert({
      where: { id: 'job_fe' },
      create: {
        id: 'job_fe', userId, companyId: figment.id,
        title: 'Staff Frontend Engineer', url: 'https://figment.example/jobs/staff-fe',
        description: 'Own the design system and web platform for our trading dashboard. React, TypeScript, WebGL.',
        location: 'Austin, TX', remote: false, salaryMin: 210_000, salaryMax: 270_000,
        status: 'APPLIED', fitScore: 74,
      },
      update: { userId },
    }),
  ]);

  const convPriya = await prisma.conversation.upsert({
    where: { id: 'conv_priya' },
    create: {
      id: 'conv_priya', userId, contactName: 'Priya Nair', contactHeadline: 'Talent Partner at Northwind AI',
      recruiterId: priya.id, companyId: northwind.id, status: 'ACTIVE',
    },
    update: { userId },
  });

  const convMarcus = await prisma.conversation.upsert({
    where: { id: 'conv_marcus' },
    create: {
      id: 'conv_marcus', userId, contactName: 'Marcus Lee', contactHeadline: 'Engineering Recruiter at Figment Labs',
      recruiterId: marcus.id, companyId: figment.id, status: 'ACTIVE',
    },
    update: { userId },
  });

  const msgs = [
    { id: 'msg_1', conversationId: convPriya.id, role: 'THEM' as const, content: 'Hi Alex! I loved your writeup on Postgres at scale. We\'re hiring a Senior Platform Engineer at Northwind — would you be open to a chat this week?' },
    { id: 'msg_2', conversationId: convPriya.id, role: 'ME' as const, content: 'Hi Priya, thanks for reaching out — the inference platform work sounds interesting. I\'m free Thursday or Friday afternoon, happy to find a slot that works for you.' },
    { id: 'msg_3', conversationId: convPriya.id, role: 'THEM' as const, content: 'Thursday 2pm works on my end. Sending a calendar invite now. Feel free to bring questions about the team!' },
    { id: 'msg_4', conversationId: convMarcus.id, role: 'THEM' as const, content: 'Hey Alex, noticed you\'re local to Austin. Figment is scaling our frontend team and I thought of you — can I share a bit about the Staff FE role?' },
  ];
  for (const m of msgs) {
    await prisma.message.upsert({
      where: { id: m.id },
      create: { id: m.id, conversationId: m.conversationId, role: m.role, content: m.content },
      update: {},
    });
  }
  await prisma.conversation.update({ where: { id: convPriya.id }, data: { lastMessageAt: new Date(Date.now() - 36_000_000) } });
  await prisma.conversation.update({ where: { id: convMarcus.id }, data: { lastMessageAt: new Date(Date.now() - 5 * 3_600_000) } });

  await prisma.interview.upsert({
    where: { id: 'int_1' },
    create: {
      id: 'int_1', userId, jobId: jobs[0]!.id, recruiterId: priya.id, title: 'Intro call — Priya (Northwind)',
      scheduledAt: new Date(Date.now() + 2 * 86_400_000), durationMin: 30, mode: 'VIDEO', status: 'SCHEDULED',
    },
    update: { userId },
  });

  await prisma.interview.upsert({
    where: { id: 'int_2' },
    create: {
      id: 'int_2', userId, jobId: jobs[0]!.id, title: 'Technical screen — Platform team',
      scheduledAt: new Date(Date.now() + 9 * 86_400_000), durationMin: 60, mode: 'TECHNICAL', status: 'SCHEDULED',
    },
    update: { userId },
  });

  await prisma.application.upsert({
    where: { id: 'app_1' },
    create: { id: 'app_1', userId, jobId: jobs[2]!.id, companyName: 'Figment Labs', roleTitle: 'Staff Frontend Engineer', status: 'SUBMITTED', appliedAt: new Date(Date.now() - 3 * 86_400_000), notes: 'Tailored cover letter around the design system work.' },
    update: { userId },
  });

  await prisma.note.upsert({
    where: { id: 'note_1' },
    create: { id: 'note_1', userId, title: 'Northwind intro call talking points', content: '- Ask about team size and oncall\n- Kubernetes scale: 10k QPS claim\n- Growth path to staff\n- Mention Postgres writeup', pinned: true, tags: ['interview', 'northwind'] },
    update: { userId },
  });

  await prisma.reminder.upsert({
    where: { id: 'rem_1' },
    create: { id: 'rem_1', userId, title: 'Send follow-up to Marcus', body: 'Reply about Figment Staff FE role — ask for the job description.', dueAt: new Date(Date.now() + 20 * 3_600_000) },
    update: { userId },
  });

  await prisma.reminder.upsert({
    where: { id: 'rem_2' },
    create: { id: 'rem_2', userId, title: 'Prep for Northwind technical screen', body: 'Review system design: rate limiting, pgvector, high-throughput ingestion.', dueAt: new Date(Date.now() + 8 * 86_400_000) },
    update: { userId },
  });

  logger.info('✅ Seed complete. Login with:');
  logger.info(`   email:    ${SEED_EMAIL}`);
  logger.info(`   password: ${SEED_PASSWORD}`);
}

main()
  .catch((err) => {
    logger.error('Seed failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
