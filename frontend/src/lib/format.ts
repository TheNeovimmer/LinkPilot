const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const DATETIME_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const TIME_FMT = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return DATE_FMT.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return DATETIME_FMT.format(new Date(d));
}

export function formatTime(d: Date | string | null | undefined): string {
  if (!d) return '—';
  return TIME_FMT.format(new Date(d));
}

export function timeAgo(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—';
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

export function formatSalary(min: number | null | undefined, max: number | null | undefined): string {
  if (min == null && max == null) return 'Not specified';
  if (min != null && max != null) return `${formatCurrency(min)} – ${formatCurrency(max)}`;
  return min != null ? `from ${formatCurrency(min)}` : `up to ${formatCurrency(max)}`;
}
