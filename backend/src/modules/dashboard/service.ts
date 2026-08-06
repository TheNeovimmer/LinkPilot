import { prisma } from '../../database/prisma.js';
import { cacheGet, cacheSet } from '../../database/redis.js';
import type { ConversationStatus, RecruiterStatus, JobStatus, ApplicationStatus } from '@prisma/client';
import type { DashboardStats } from './types.js';

export class DashboardService {
  private async compute(userId: string): Promise<DashboardStats> {
    const now = new Date();

    const [conversations, jobs, applications, recruiters, interviews, _reminders, messages] =
      await Promise.all([
        prisma.conversation.groupBy({ by: ['status'], where: { userId }, _count: true }),
        prisma.job.groupBy({ by: ['status'], where: { userId }, _count: true }),
        prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
        prisma.recruiter.groupBy({ by: ['status'], where: { userId }, _count: true }),
        prisma.interview.findMany({
          where: { userId, status: 'SCHEDULED', scheduledAt: { gte: now } },
          orderBy: { scheduledAt: 'asc' },
          take: 6,
          select: { id: true, title: true, scheduledAt: true, mode: true, job: { select: { company: { select: { name: true } } } } },
        }),
        prisma.reminder.aggregate({
          where: { userId, done: false },
          _count: true,
        }),
        prisma.message.count({
          where: { conversation: { userId }, createdAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } },
        }),
      ]);

    const [recentConversations, avgFit, overdue, dueSoon, completedInterviews, conversationTotal, activeConversations] =
      await Promise.all([
        prisma.conversation.findMany({
          where: { userId },
          orderBy: { lastMessageAt: 'desc' },
          take: 5,
          select: { id: true, contactName: true, lastMessageAt: true, status: true, _count: { select: { messages: true } } },
        }),
        prisma.job.aggregate({ where: { userId, fitScore: { not: null } }, _avg: { fitScore: true } }),
        prisma.reminder.count({ where: { userId, done: false, dueAt: { lt: now } } }),
        prisma.reminder.count({
          where: { userId, done: false, dueAt: { gte: now, lte: new Date(now.getTime() + 48 * 3_600_000) } },
        }),
        prisma.interview.count({ where: { userId, status: 'COMPLETED' } }),
        prisma.conversation.count({ where: { userId } }),
        prisma.conversation.count({ where: { userId, status: 'ACTIVE' } }),
      ]);

    const countBy = <T extends string>(rows: { status: T; _count: number }[]): Record<T, number> =>
      Object.fromEntries(rows.map((r) => [r.status, r._count])) as Record<T, number>;

    return {
      generatedAt: now.toISOString(),
      conversations: {
        total: conversationTotal,
        active: activeConversations,
        byStatus: countBy(conversations as { status: ConversationStatus; _count: number }[]),
        recent: recentConversations.map((c) => ({
          id: c.id,
          contactName: c.contactName,
          lastMessageAt: c.lastMessageAt,
          messageCount: c._count.messages,
          status: c.status,
        })),
        messagesLast7Days: messages,
      },
      recruiters: { ...countBy(recruiters as { status: RecruiterStatus; _count: number }[]), total: await prisma.recruiter.count({ where: { userId } }) },
      jobs: { ...countBy(jobs as { status: JobStatus; _count: number }[]), total: await prisma.job.count({ where: { userId } }), avgFitScore: avgFit._avg.fitScore },
      applications: { ...countBy(applications as { status: ApplicationStatus; _count: number }[]), total: await prisma.application.count({ where: { userId } }) },
      interviews: {
        upcoming: interviews.map((i) => ({
          id: i.id,
          title: i.title,
          scheduledAt: i.scheduledAt,
          mode: i.mode,
          companyName: i.job?.company?.name ?? null,
        })),
        completed: completedInterviews,
      },
      reminders: { overdue, dueNext48h: dueSoon },
    };
  }

  /** Dashboard stats with a short Redis cache. */
  async stats(userId: string): Promise<DashboardStats> {
    const key = `dashboard:${userId}`;
    const cached = await cacheGet<DashboardStats>(key);
    if (cached) return cached;
    const stats = await this.compute(userId);
    await cacheSet(key, stats, 30);
    return stats;
  }
}
