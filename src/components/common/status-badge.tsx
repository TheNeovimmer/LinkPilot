import { Badge, type BadgeProps } from '@/components/ui/badge';
import type { ApplicationStatus, ConversationStatus, InterviewStatus, JobStatus, RecruiterStatus } from '@/types';

type Variant = BadgeProps['variant'];

export const JOB_STATUS_META: Record<JobStatus, { label: string; variant: Variant }> = {
  WATCHLIST: { label: 'Watchlist', variant: 'default' },
  APPLIED: { label: 'Applied', variant: 'info' },
  INTERVIEWING: { label: 'Interviewing', variant: 'violet' },
  OFFER: { label: 'Offer', variant: 'accent' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  CLOSED: { label: 'Closed', variant: 'default' },
};

export const RECRUITER_STATUS_META: Record<RecruiterStatus, { label: string; variant: Variant }> = {
  NEW: { label: 'New', variant: 'default' },
  CONTACTED: { label: 'Contacted', variant: 'info' },
  RESPONDED: { label: 'Responded', variant: 'warning' },
  INTERVIEW_SCHEDULED: { label: 'Interview', variant: 'violet' },
  OFFER: { label: 'Offer', variant: 'accent' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  INACTIVE: { label: 'Inactive', variant: 'default' },
};

export const APPLICATION_STATUS_META: Record<ApplicationStatus, { label: string; variant: Variant }> = {
  DRAFT: { label: 'Draft', variant: 'default' },
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  UNDER_REVIEW: { label: 'Under review', variant: 'warning' },
  INTERVIEWING: { label: 'Interviewing', variant: 'violet' },
  OFFER: { label: 'Offer', variant: 'accent' },
  REJECTED: { label: 'Rejected', variant: 'destructive' },
  WITHDRAWN: { label: 'Withdrawn', variant: 'default' },
};

export const INTERVIEW_STATUS_META: Record<InterviewStatus, { label: string; variant: Variant }> = {
  SCHEDULED: { label: 'Scheduled', variant: 'info' },
  COMPLETED: { label: 'Completed', variant: 'accent' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'warning' },
};

export const CONVERSATION_STATUS_META: Record<ConversationStatus, { label: string; variant: Variant }> = {
  ACTIVE: { label: 'Active', variant: 'accent' },
  ARCHIVED: { label: 'Archived', variant: 'default' },
};

interface StatusBadgeProps {
  status: string;
  meta: Record<string, { label: string; variant: Variant }>;
}

export function StatusBadge({ status, meta }: StatusBadgeProps) {
  const item = meta[status] ?? { label: status, variant: 'default' as Variant };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}
