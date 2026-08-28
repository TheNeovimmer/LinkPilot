import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  hint?: string;
  accent?: 'default' | 'accent' | 'warning' | 'destructive';
  onClick?: () => void;
}

export function StatCard({ label, value, icon: Icon, hint, accent = 'default', onClick }: StatCardProps) {
  const dotColor =
    accent === 'accent' ? 'bg-accent' : accent === 'warning' ? 'bg-warning' : accent === 'destructive' ? 'bg-destructive' : 'bg-text-muted';
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-colors',
        onClick && 'cursor-pointer hover:border-border-strong',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
          <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
          {label}
        </span>
        {Icon ? <Icon className="h-4 w-4 text-text-muted" strokeWidth={1.75} /> : null}
      </div>
      <div className="mt-2 font-mono text-[22px] leading-none tracking-tight text-text">{value}</div>
      {hint ? <div className="mt-1.5 text-[11px] text-text-muted">{hint}</div> : null}
    </div>
  );
}
