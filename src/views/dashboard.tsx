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
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/common/stat-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/empty-state';
import { formatDateTime, timeAgo } from '@/lib/format';
import { CONVERSATION_STATUS_META, StatusBadge } from '@/components/common/status-badge';
import { useUI } from '@/stores/ui';
import type { DashboardStats } from '@/types';

export function DashboardPage() {
  const aiNoticeDismissed = useUI((s) => s.aiNoticeDismissed);
  const dismissAiNotice = useUI((s) => s.dismissAiNotice);

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
  const applyTotal = (stats?.jobs.APPLIED ?? 0) + (stats?.jobs.INTERVIEWING ?? 0) + (stats?.jobs.OFFER ?? 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">Overview</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-text">
            {profile?.displayName ? `Welcome back, ${profile.displayName.split(' ')[0]}` : 'Welcome back'}
          </h1>
          <p className="mt-0.5 text-[13px] text-text-muted">
            {stats?.interviews.upcoming.length
              ? `Your next interview is ${formatDateTime(stats.interviews.upcoming[0]?.scheduledAt)}.`
              : 'No interviews on the horizon — keep the pipeline moving.'}
          </p>
        </div>
      </div>

      {!aiNoticeDismissed ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" strokeWidth={1.75} />
          <p className="flex-1 text-[13px] text-text-secondary">
            AI drafting is not configured. Set <span className="font-mono text-[12px] text-warning">AI_API_KEY</span> (OpenCode Zen works
            out of the box) in the backend environment to enable drafts, job analysis and interview prep.
          </p>
          <button onClick={dismissAiNotice} className="text-[12px] text-text-muted transition-colors hover:text-text cursor-pointer">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[92px] rounded-[var(--radius-card)]" />)
        ) : (
          <>
            <StatCard label="Conversations" value={stats?.conversations.active ?? 0} icon={MessageSquare} hint={`${stats?.conversations.total ?? 0} total`} onClick={() => undefined} />
            <StatCard label="Active applications" value={applyTotal} icon={Send} accent="accent" hint={`${stats?.jobs.total ?? 0} jobs tracked`} />
            <StatCard label="Recruiters" value={stats?.recruiters.total ?? 0} icon={Users} hint={`${stats?.recruiters.INTERVIEW_SCHEDULED ?? 0} in interviews`} />
            <StatCard
              label="Avg fit score"
              value={stats?.jobs.avgFitScore != null ? `${Math.round(stats.jobs.avgFitScore)}` : '—'}
              icon={Sparkles}
              accent="warning"
              hint={jobStats ? `${jobStats.analyzed} jobs analyzed` : undefined}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming interviews */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
              Upcoming interviews
            </CardTitle>
            <Link href="/interviews" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
              All <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
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
                {stats.interviews.upcoming.map((i) => (
                  <Link key={i.id} href={`/interviews/${i.id}`} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 ring-1 ring-border">
                      <Briefcase className="h-4 w-4 text-text-secondary" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-text">{i.title}</p>
                      <p className="truncate text-[11.5px] text-text-muted">{i.companyName ?? 'No company'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-[12px] text-text-secondary">{formatDateTime(i.scheduledAt)}</p>
                      <p className="font-mono text-[10px] uppercase tracking-wide text-text-muted">{i.mode}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarClock}
                title="Nothing scheduled"
                description="Interviews you schedule will show up here with AI prep."
                action={
                  <Link href="/interviews?new=1" className="text-[12.5px] text-accent hover:underline">
                    Schedule an interview
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
              Recent conversations
            </CardTitle>
            <Link href="/conversations" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
              All <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
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
                      <p className="font-mono text-[10.5px] text-text-muted">{timeAgo(c.lastMessageAt)} · {c.messageCount} msgs</p>
                    </div>
                    <StatusBadge status={c.status} meta={CONVERSATION_STATUS_META} />
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="Track recruiter and hiring-manager chats here."
                action={
                  <Link href="/conversations?new=1" className="text-[12.5px] text-accent hover:underline">
                    Start one
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Job pipeline summary */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
            Job pipeline
          </CardTitle>
          <Link href="/jobs" className="flex items-center gap-0.5 text-[12px] text-accent transition-colors hover:text-accent-strong">
            All jobs <ArrowUpRight className="h-3 w-3" strokeWidth={1.75} />
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : jobCount === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Track your first job"
              description="Add roles you're watching, applying to, or interviewing for — the AI can analyze fit for each one."
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {([
                ['WATCHLIST', 'Watchlist'],
                ['APPLIED', 'Applied'],
                ['INTERVIEWING', 'Interviewing'],
                ['OFFER', 'Offer'],
                ['REJECTED', 'Rejected'],
                ['CLOSED', 'Closed'],
              ] as const).map(([key, label]) => (
                <div key={key} className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2.5">
                  <p className="font-mono text-lg leading-none text-text">{(stats?.jobs[key] as number) ?? 0}</p>
                  <p className="mt-1 text-[11px] text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Due reminders strip */}
      {stats && stats.reminders.overdue + stats.reminders.dueNext48h > 0 ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-warning/30 bg-warning-muted px-4 py-3">
          <Badge variant="warning" className="shrink-0">
            {stats.reminders.overdue + stats.reminders.dueNext48h} due
          </Badge>
          <p className="text-[13px] text-text-secondary">
            {stats.reminders.overdue > 0 ? `${stats.reminders.overdue} overdue, ` : ''}
            {stats.reminders.dueNext48h} due in the next 48 hours.
          </p>
          <Link href="/reminders" className="ml-auto shrink-0 text-[12.5px] text-warning hover:underline">
            View reminders
          </Link>
        </div>
      ) : null}
    </div>
  );
}
