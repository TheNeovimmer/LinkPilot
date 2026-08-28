import { useLocale } from '@/stores/locale';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { ApplicationStatus, ConversationStatus, InterviewStatus, JobStatus, RecruiterStatus } from '@/types';

type Variant = BadgeProps['variant'];

export const JOB_STATUS_META: Record<JobStatus, { labelKey: string; variant: Variant }> = {
  WATCHLIST: { labelKey: 'job.status.WATCHLIST', variant: 'default' },
  APPLIED: { labelKey: 'job.status.APPLIED', variant: 'info' },
  INTERVIEWING: { labelKey: 'job.status.INTERVIEWING', variant: 'violet' },
  OFFER: { labelKey: 'job.status.OFFER', variant: 'accent' },
  REJECTED: { labelKey: 'job.status.REJECTED', variant: 'destructive' },
  CLOSED: { labelKey: 'job.status.CLOSED', variant: 'default' },
};

export const RECRUITER_STATUS_META: Record<RecruiterStatus, { labelKey: string; variant: Variant }> = {
  NEW: { labelKey: 'recruiter.status.NEW', variant: 'default' },
  CONTACTED: { labelKey: 'recruiter.status.CONTACTED', variant: 'info' },
  RESPONDED: { labelKey: 'recruiter.status.RESPONDED', variant: 'warning' },
  INTERVIEW_SCHEDULED: { labelKey: 'recruiter.status.INTERVIEW_SCHEDULED', variant: 'violet' },
  OFFER: { labelKey: 'recruiter.status.OFFER', variant: 'accent' },
  REJECTED: { labelKey: 'recruiter.status.REJECTED', variant: 'destructive' },
  INACTIVE: { labelKey: 'recruiter.status.INACTIVE', variant: 'default' },
};

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { labelKey: string; variant: Variant }> = {
  DRAFT: { labelKey: 'app.status.DRAFT', variant: 'default' },
  SUBMITTED: { labelKey: 'app.status.SUBMITTED', variant: 'info' },
  UNDER_REVIEW: { labelKey: 'app.status.UNDER_REVIEW', variant: 'warning' },
  INTERVIEWING: { labelKey: 'app.status.INTERVIEWING', variant: 'violet' },
  OFFER: { labelKey: 'app.status.OFFER', variant: 'accent' },
  REJECTED: { labelKey: 'app.status.REJECTED', variant: 'destructive' },
  WITHDRAWN: { labelKey: 'app.status.WITHDRAWN', variant: 'default' },
};

export const INTERVIEW_STATUS_META: Record<InterviewStatus, { labelKey: string; variant: Variant }> = {
  SCHEDULED: { labelKey: 'interview.status.SCHEDULED', variant: 'info' },
  COMPLETED: { labelKey: 'interview.status.COMPLETED', variant: 'accent' },
  CANCELLED: { labelKey: 'interview.status.CANCELLED', variant: 'destructive' },
  RESCHEDULED: { labelKey: 'interview.status.RESCHEDULED', variant: 'warning' },
};

export const CONVERSATION_STATUS_META: Record<ConversationStatus, { labelKey: string; variant: Variant }> = {
  ACTIVE: { labelKey: 'conv.status.ACTIVE', variant: 'accent' },
  ARCHIVED: { labelKey: 'conv.status.ARCHIVED', variant: 'default' },
};

/** Generic status meta used by list/detail rendering that only needs a variant + key. */
export type StatusMeta = Record<string, { labelKey: string; variant: Variant }>;

interface StatusBadgeProps {
  status: string;
  meta: StatusMeta;
}

export function StatusBadge({ status, meta }: StatusBadgeProps) {
  const t = useLocale((s) => s.t);
  const item = meta[status] ?? { labelKey: status, variant: 'default' as Variant };
  return <Badge variant={item.variant}>{t(item.labelKey)}</Badge>;
}
