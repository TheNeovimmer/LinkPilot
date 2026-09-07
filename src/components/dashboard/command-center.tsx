'use client';

import Link from 'next/link';
import { Award, CalendarRange, Gauge, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/stores/locale';
import type { DashboardStats } from '@/types';

function formatMoney(amount: number | null, currency: string): string | null {
  if (amount == null) return null;
  return `${currency} ${amount.toLocaleString()}`;
}

/** 30-day trend with total + peak highlight. */
function TrendBars({ data }: { data: DashboardStats['analytics']['applicationsTrend'] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <p className="font-mono text-lg leading-none text-text">{total}</p>
        <p className="text-[11px] text-text-muted">peak {max}/day</p>
      </div>
      <div className="flex h-16 items-end gap-[3px]" role="img" aria-label={`${total} applications in last 30 days`}>
        {data.map((d) => {
          const h = Math.round((d.count / max) * 100);
          const isPeak = d.count === max && max > 0;
          return (
            <div key={d.date} className="group relative flex-1" title={`${d.date}: ${d.count}`}>
              <div
                className={isPeak ? 'w-full rounded-t-sm bg-accent transition-colors group-hover:bg-accent-strong' : 'w-full rounded-t-sm bg-accent/50 transition-colors group-hover:bg-accent'}
                style={{ height: `${Math.max(d.count ? h : 4, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CommandCenter({ analytics }: { analytics: DashboardStats['analytics'] }) {
  const t = useLocale((s) => s.t);
  const r = analytics.responses;

  const funnel = [
    { label: t('analytics.funnel.submitted'), value: analytics.funnel.submitted, color: 'bg-surface-3' },
    { label: t('analytics.funnel.interview'), value: analytics.funnel.interviewing, color: 'bg-accent/50' },
    { label: t('analytics.funnel.offer'), value: analytics.funnel.offers, color: 'bg-accent' },
    { label: t('analytics.funnel.accepted'), value: analytics.funnel.accepted, color: 'bg-accent-strong' },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Funnel + trend */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex-row items-center gap-2">
          <Gauge className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          <CardTitle>{t('analytics.funnel.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {funnel.map((stage, idx) => {
              const prev = idx === 0 ? null : funnel[idx - 1].value;
              const conv = prev && prev > 0 ? Math.round((stage.value / prev) * 100) : null;
              const pct = funnel[0].value > 0 ? Math.max(8, Math.round((stage.value / Math.max(1, funnel[0].value)) * 100)) : 8;
              return (
                <div key={stage.label} className="rounded-[var(--radius-control)] border border-border px-2 py-2 text-center">
                  <p className="font-mono text-lg leading-none text-text">{stage.value}</p>
                  <div className="mx-auto mt-2 h-1 w-full max-w-[64px] overflow-hidden rounded-full bg-surface-3">
                    <div className={`h-full rounded-full ${stage.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-text-muted">{stage.label}</p>
                  {conv != null ? <p className="font-mono text-[10px] text-accent">{conv}%</p> : null}
                </div>
              );
            })}
          </div>

          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
              <CalendarRange className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('analytics.trend.title')}
            </div>
            <div className="rounded-[var(--radius-control)] border border-border bg-surface-2 px-2 pt-2">
              <TrendBars data={analytics.applicationsTrend} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response + open offers */}
      <Card>
        <CardHeader className="flex-row items-center gap-2">
          <Sparkles className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
          <CardTitle>{t('analytics.responses.title')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5">
              <p className="font-mono text-lg leading-none text-text">{r.responseRate != null ? `${Math.round(r.responseRate * 100)}%` : '—'}</p>
              <p className="mt-1 text-[10.5px] text-text-muted">{t('analytics.responses.rate')}</p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5">
              <p className="font-mono text-lg leading-none text-text">
                {r.avgDaysToFirstResponse != null ? `${Math.round(r.avgDaysToFirstResponse)}d` : '—'}
              </p>
              <p className="mt-1 text-[10.5px] text-text-muted">{t('analytics.responses.avgDays')}</p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5">
              <p className="font-mono text-lg leading-none text-text">{r.awaitingReply}</p>
              <p className="mt-1 text-[10.5px] text-text-muted">{t('analytics.responses.awaiting')}</p>
            </div>
            <div className="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2.5">
              <p className="font-mono text-lg leading-none text-text">{r.days7}</p>
              <p className="mt-1 text-[10.5px] text-text-muted">{t('analytics.responses.within7')}</p>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-[12px] text-text-secondary">
              <Award className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t('analytics.offers.title')}
            </p>
            {analytics.offersOpen.length ? (
              <div className="space-y-1.5">
                {analytics.offersOpen.map((o) => (
                  <Link
                    key={o.id}
                    href="/applications"
                    className="flex items-center justify-between rounded-[var(--radius-control)] border border-accent-border bg-accent-muted px-3 py-2 transition-colors hover:bg-accent-muted"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-medium text-text">{o.roleTitle ?? o.companyName ?? 'Offer'}</p>
                      <p className="truncate text-[11px] text-text-muted">{o.companyName}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[12px] text-accent-strong">
                      {formatMoney(o.offerAmount, o.offerCurrency) ?? t('analytics.offers.open')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="flex items-center gap-2 text-[12.5px] text-text-muted">
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t('analytics.offers.none')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}