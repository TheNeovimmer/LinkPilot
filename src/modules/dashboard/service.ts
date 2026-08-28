import { prisma } from '../../database/prisma';
import type { ConversationStatus, RecruiterStatus, JobStatus, ApplicationStatus } from '@prisma/client';
import type { DashboardStats } from './types';

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
      analytics: await this.computeAnalytics(userId),
    };
  }

  /** Funnel, response-rate and open-offer analytics. */
  private async computeAnalytics(userId: string): Promise<DashboardStats['analytics']> {
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

    const [funnelRows, trendRows, respondedApps, awaiting, offersOpen] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
      prisma.application.groupBy({
        by: ['appliedAt'],
        where: { userId, appliedAt: { gte: daysAgo(29) } },
        _count: true,
      }),
      prisma.application.findMany({
        where: { userId, firstResponseAt: { not: null } },
        select: { appliedAt: true, firstResponseAt: true, status: true },
      }),
      prisma.application.count({
        where: {
          userId,
          appliedAt: { not: null },
          firstResponseAt: null,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.application.findMany({
        where: { userId, status: 'OFFER', offerStatus: { in: ['PENDING', 'NEGOTIATING'] } },
        select: {
          id: true,
          roleTitle: true,
          companyName: true,
          offerAmount: true,
          offerCurrency: true,
          offerFrequency: true,
          offerStatus: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    const cnt = (s: ApplicationStatus) => funnelRows.find((r) => r.status === s)?._count ?? 0;
    const funnel = {
      submitted: cnt('SUBMITTED') + cnt('UNDER_REVIEW') + cnt('INTERVIEWING') + cnt('OFFER'),
      interviewing: cnt('INTERVIEWING') + cnt('OFFER'),
      offers: cnt('OFFER'),
      rejected: cnt('REJECTED'),
    };

    // Accepted = offers explicitly marked accepted.
    const acceptedApps = await prisma.application.count({
      where: { userId, status: 'OFFER', offerStatus: { in: ['ACCEPTED'] } },
    });

    // Per-day application trend (keyed by appliedAt date, in UTC date).
    const byDay = new Map<string, number>();
    for (const r of trendRows) {
      if (!r.appliedAt) continue;
      const key = r.appliedAt.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + r._count);
    }
    const trend: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const key = daysAgo(i).toISOString().slice(0, 10);
      trend.push({ date: key, count: byDay.get(key) ?? 0 });
    }

    // Response metrics from firstResponseAt - appliedAt.
    const deltas: number[] = [];
    for (const a of respondedApps) {
      if (!a.appliedAt || !a.firstResponseAt || a.firstResponseAt <= a.appliedAt) continue;
      deltas.push((a.firstResponseAt.getTime() - a.appliedAt.getTime()) / 86_400_000);
    }
    const responses = deltas.length;
    const avgDays =
      deltas.length > 0 ? deltas.reduce((s, d) => s + d, 0) / deltas.length : null;
    // Response rate among apps that are decided-or-still-awaiting.
    const denom = responses + awaiting;
    const responseRate = denom > 0 ? responses / denom : null;

    return {
      funnel: { ...funnel, accepted: acceptedApps },
      applicationsTrend: trend,
      responses: {
        responses,
        awaitingReply: awaiting,
        responseRate,
        avgDaysToFirstResponse: avgDays,
        days7: deltas.filter((d) => d <= 7).length,
        days14: deltas.filter((d) => d <= 14).length,
        days30: deltas.filter((d) => d <= 30).length,
      },
      offersOpen: offersOpen.map((o) => ({
        id: o.id,
        roleTitle: o.roleTitle,
        companyName: o.companyName,
        offerAmount: o.offerAmount,
        offerCurrency: o.offerCurrency,
        offerFrequency: o.offerFrequency,
        offerStatus: o.offerStatus,
      })),
    };
  }

  /** Dashboard stats (computed on demand — no cache). */
  async stats(userId: string): Promise<DashboardStats> {
    return this.compute(userId);
  }
}
