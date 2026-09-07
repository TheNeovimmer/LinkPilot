'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowUpRight,
  Briefcase,
  CalendarClock,
  MessageSquare,
  Send,
  Sparkles,
  Users,
  AlertCircle,
  Plus,
  Clock,
  Flame,
  TrendingUp,
  Star,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/common/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { Reveal } from '@/components/common/reveal';
import { formatDateTime, timeAgo } from '@/lib/format';
import { CONVERSATION_STATUS_META, StatusBadge } from '@/components/common/status-badge';
import { CommandCenter } from '@/components/dashboard/command-center';
import { useUI } from '@/stores/ui';
import { useLocale } from '@/stores/locale';
import type { DashboardStats } from '@/types';

export function DashboardPage() {
  const aiNoticeDismissed = useUI((s) => s.aiNoticeDismissed);
  const dismissAiNotice = useUI((s) => s.dismissAiNotice);
  const t = useLocale((s) => s.t);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get('/dashboard/stats')).data.data as DashboardStats,
    refetchInterval: 60_000,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => (await api.get('/users/me')).data.data,
  });

  const { data: jobStats } = useQuery({
    queryKey: ['jobs', 'stats'],
    queryFn: async () => (await api.get('/jobs/stats')).data.data,
  });

  const jobCount = stats?.jobs.total ?? 0;
  const apps = stats?.applications;
  const applyTotal = ((apps?.SUBMITTED ?? 0) + (apps?.UNDER_REVIEW ?? 0) + (apps?.INTERVIEWING ?? 0) + (apps?.OFFER ?? 0));
  const momentum = stats?.momentum;
  const attention = stats?.attention;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">{t('dashboard.overview')}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
            {profile?.displayName ? t('dashboard.welcomeName', { name: profile.displayName.split(' ')[0] }) : t('dashboard.welcome')}
          </h1>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {stats?.interviews.upcoming.length
              ? t('dashboard.nextInterview', { date: formatDateTime(stats.interviews.upcoming[0]?.scheduledAt) })
              : t('dashboard.noInterviews')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/applications?new=1" className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-control)] bg-accent px-3 text-[12.5px] font-medium text-accent-ink transition-colors hover:bg-accent-strong">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            {t('dashboard.quick.logApp')}
          </Link>
          <Link href="/jobs?new=1" className="inline-flex h-8 items-center rounded-[var(--radius-control)] border border-border bg-surface px-3 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text">
            {t('dashboard.quick.addJob')}
          </Link>
          <Link href="/interviews?new=1" className="hidden h-8 items-center rounded-[var(--radius-control)] border border-border bg-surface px-3 text-[12.5px] font-medium text-text-secondary transition-colors hover:border-border-strong hover:text-text sm:inline-flex">
            {t('dashboard.quick.schedule')}
          </Link>
        </div>
      </div>

      {!aiNoticeDismissed ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
          <p className="flex-1 text-[13px] text-text-secondary">
            {t('dashboard.aiNotice', { key: 'AI_API_KEY' })}
          </p>
          <button onClick={dismissAiNotice} className="text-[12px] text-text-muted transition-colors hover:text-text cursor-pointer">
            {t('dashboard.dismiss')}
          </button>
        </div>
      ) : null}

      {/* Stat grid */}
      <Reveal delay={0.05}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-[var(--radius-card)]" />)
          ) : (
            <>
              <Link href="/conversations" className="block"><StatCard label={t('dashboard.stat.conversations')} value={stats?.conversations.active ?? 0} icon={MessageSquare} hint={t('dashboard.stat.total', { n: stats?.conversations.total ?? 0 })} /></Link>
              <Link href="/applications" className="block"><StatCard label={t('dashboard.stat.activeApps')} value={applyTotal} icon={Send} accent="accent" hint={t('dashboard.stat.jobsTracked', { n: stats?.jobs.total ?? 0 })} /></Link>
              <Link href="/recruiters" className="block"><StatCard label={t('dashboard.stat.recruiters')} value={stats?.recruiters.total ?? 0} icon={Users} hint={t('dashboard.stat.inInterviews', { n: stats?.recruiters.INTERVIEW_SCHEDULED ?? 0 })} /></Link>
              <Link href="/jobs" className="block"><StatCard
                label={t('dashboard.stat.avgFit')}
                value={stats?.jobs.avgFitScore != null ? `${Math.round(stats.jobs.avgFitScore)}` : '—'}
                icon={Sparkles}
                accent="warning"
                hint={jobStats ? t('dashboard.stat.analyzed', { n: jobStats.analyzed }) : undefined}
              /></Link>
            </>
          )}
        </div>
      </Reveal>

      {/* Attention + momentum */}
      {stats && !isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center gap-2">
              <Flame className="h-4 w-4 text-warning" strokeWidth={1.75} />
              <CardTitle>{t('dashboard.attention.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              {(attention?.staleApplications?.length || stats.reminders.items?.filter((r) => new Date(r.dueAt).getTime() < Date.parse(stats.generatedAt)).length || attention?.staleRecruiters?.length) ? (
                <div className="divide-y divide-border/60">
                  {(attention?.staleApplications ?? []).slice(0, 3).map((a) => (
                    <Link key={a.id} href="/applications" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-warning-muted ring-1 ring-border">
                        <Clock className="h-3.5 w-3.5 text-warning" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">{a.roleTitle ?? 'Application'} at {a.companyName ?? 'unknown'} · {a.waitingDays}d no reply</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
                    </Link>
                  ))}
                  {(stats.reminders.items ?? []).filter((r) => new Date(r.dueAt).getTime() < Date.parse(stats.generatedAt)).slice(0, 2).map((r) => (
                    <Link key={r.id} href="/reminders" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-destructive/10 ring-1 ring-border">
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">{r.title} · overdue {formatDateTime(r.dueAt)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
                    </Link>
                  ))}
                  {(attention?.staleRecruiters ?? []).slice(0, 2).map((r) => (
                    <Link key={r.id} href="/recruiters" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 ring-1 ring-border">
                        <Users className="h-3.5 w-3.5 text-text-secondary" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-text-secondary">{r.name} · no contact {timeAgo(r.lastContactAt)}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-text-muted" strokeWidth={1.75} />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">{t('dashboard.attention.empty')}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" strokeWidth={1.75} />
              <CardTitle>{t('dashboard.momentum.title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-2 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5 text-center">
                <p className="font-mono text-lg leading-none text-text">{momentum?.appsThisWeek ?? 0}</p>
                <p className="mt-1 text-[10.5px] text-text-muted">{t('dashboard.momentum.apps')}</p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5 text-center">
                <p className="font-mono text-lg leading-none text-text">{momentum?.interviewsNext7 ?? stats.interviews.upcoming.length}</p>
                <p className="mt-1 text-[10.5px] text-text-muted">{t('dashboard.momentum.interviews')}</p>
              </div>
              <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5 text-center">
                <p className="font-mono text-lg leading-none text-text">{momentum?.messagesLast7Days ?? stats.conversations.messagesLast7Days}</p>
                <p className="mt-1 text-[10.5px] text-text-muted">{t('dashboard.momentum.messages')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Command center — funnel, response analytics, open offers, trend */}
      {stats && !isLoading && <CommandCenter analytics={stats.analytics} />}

      <Reveal delay={0.1}>
        <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming interviews */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              {t('dashboard.upcomingInterviews')}
            </CardTitle>
            <Link href="/interviews" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
              {t('dashboard.all')} <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : stats?.interviews.upcoming.length ? (
              <div className="divide-y divide-border/60">
                {stats.interviews.upcoming.slice(0, 5).map((i) => (
                  <Link key={i.id} href="/interviews" className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 ring-1 ring-border">
                      <Briefcase className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text">{i.title}</p>
                      <p className="truncate text-[11.5px] text-text-muted">{i.companyName ?? t('common.noCompany')}</p>
                    </div>
                    <div className="text-end">
                      <p className="font-mono text-[12px] text-text-secondary">{formatDateTime(i.scheduledAt)}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-text-muted">{i.mode}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title={t('dashboard.interview.nothing')}
                description={t('dashboard.interview.empty')}
                action={
                  <Link href="/interviews?new=1" className="text-[12.5px] text-accent hover:underline">
                    {t('dashboard.interview.schedule')}
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>

        {/* Recent conversations */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              {t('dashboard.recentConversations')}
            </CardTitle>
            <Link href="/conversations" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
              {t('dashboard.all')} <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : stats?.conversations.recent.length ? (
              <div className="space-y-1">
                {stats.conversations.recent.map((c) => (
                  <Link
                    key={c.id}
                    href={`/conversations/${c.id}`}
                    className="flex items-center gap-2.5 rounded-[var(--radius-control)] px-2 py-2 transition-colors hover:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text">{c.contactName}</p>
                      <p className="font-mono text-[10.5px] text-text-muted">{timeAgo(c.lastMessageAt)} · {t('common.msgs', { n: c.messageCount })}</p>
                    </div>
                    <StatusBadge status={c.status} meta={CONVERSATION_STATUS_META} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title={t('dashboard.conv.none')}
                description={t('dashboard.conv.empty')}
                action={
                  <Link href="/conversations?new=1" className="text-[12.5px] text-accent hover:underline">
                    {t('dashboard.conv.start')}
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      </Reveal>

      {/* Recent apps + top fit */}
      {stats && !isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
                {t('dashboard.recentApps')}
              </CardTitle>
              <Link href="/applications" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
                {t('dashboard.viewAll')} <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </CardHeader>
            <CardContent>
              {(stats.recentApplications ?? []).length ? (
                <div className="divide-y divide-border/60">
                  {(stats.recentApplications ?? []).map((a) => (
                    <Link key={a.id} href="/applications" className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-text">{a.roleTitle ?? 'Application'} <span className="font-normal text-text-muted">· {a.companyName ?? ''}</span></span>
                      <span className="shrink-0 font-mono text-[11px] text-text-muted">{a.status}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">{t('dashboard.job.empty')}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" strokeWidth={1.75} />
                {t('dashboard.topJobs')}
              </CardTitle>
              <Link href="/jobs" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
                {t('dashboard.viewAll')} <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
              </Link>
            </CardHeader>
            <CardContent>
              {(stats.topJobs ?? []).length ? (
                <div className="space-y-2">
                  {(stats.topJobs ?? []).map((j) => (
                    <Link key={j.id} href="/jobs" className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 transition-colors hover:border-border-strong">
                      <span className="min-w-0 truncate text-[12.5px] font-medium text-text">{j.title}</span>
                      <span className="shrink-0 rounded-full bg-warning-muted px-2 py-0.5 font-mono text-[11px] text-warning">{j.fitScore}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-muted">{t('dashboard.topJobs.empty')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Job pipeline summary */}
      <Reveal delay={0.15}>
        <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
            {t('dashboard.jobPipeline')}
          </CardTitle>
          <Link href="/jobs" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
            {t('dashboard.allJobs')} <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : jobCount === 0 ? (
            <EmptyState
              icon={Briefcase}
              title={t('dashboard.job.none')}
              description={t('dashboard.job.empty')}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {([
                ['WATCHLIST', 'job.status.WATCHLIST'],
                ['APPLIED', 'job.status.APPLIED'],
                ['INTERVIEWING', 'job.status.INTERVIEWING'],
                ['OFFER', 'job.status.OFFER'],
                ['REJECTED', 'job.status.REJECTED'],
                ['CLOSED', 'job.status.CLOSED'],
              ] as const).map(([key, labelKey]) => (
                <Link key={key} href="/jobs" className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2.5 transition-colors hover:border-border-strong">
                  <p className="font-mono text-lg leading-none text-text">{(stats?.jobs[key] as number) ?? 0}</p>
                  <p className="mt-1 text-[11px] text-text-muted">{t(labelKey)}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </Reveal>

      {/* Due reminders strip */}
      {stats && stats.reminders.overdue + stats.reminders.dueNext48h > 0 ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted px-4 py-3">
          <Badge variant="warning" className="shrink-0">
            {t('dashboard.reminders.due', { n: stats.reminders.overdue + stats.reminders.dueNext48h })}
          </Badge>
          <p className="text-[13px] text-text-secondary">
            {stats.reminders.overdue > 0 ? `${stats.reminders.overdue} overdue, ` : ''}
            {t('dashboard.reminders.body', { n: stats.reminders.dueNext48h })}.
          </p>
          <Link href="/reminders" className="ms-auto shrink-0 text-[12.5px] text-warning hover:underline">
            {t('dashboard.reminders.view')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
