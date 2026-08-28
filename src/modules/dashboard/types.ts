import type { JobStatus, ApplicationStatus, RecruiterStatus, ConversationStatus } from '@prisma/client';

export interface DashboardStats {
  generatedAt: string;
  conversations: {
    total: number;
    active: number;
    byStatus: Partial<Record<ConversationStatus, number>>;
    recent: {
      id: string;
      contactName: string;
      lastMessageAt: Date | null;
      messageCount: number;
      status: ConversationStatus;
    }[];
    messagesLast7Days: number;
  };
  recruiters: Partial<Record<RecruiterStatus, number>> & { total: number };
  jobs: Partial<Record<JobStatus, number>> & { total: number; avgFitScore: number | null };
  applications: Partial<Record<ApplicationStatus, number>> & { total: number };
  interviews: {
    upcoming: {
      id: string;
      title: string;
      scheduledAt: Date;
      mode: string;
      companyName: string | null;
    }[];
    completed: number;
  };
  reminders: {
    overdue: number;
    dueNext48h: number;
  };
  /** Job-search decision intelligence (computed from application timestamps). */
  analytics: {
    /** Funnel counts — how far submitted apps progressed. */
    funnel: {
      submitted: number;
      interviewing: number;
      offers: number;
      accepted: number;
      rejected: number;
    };
    /** Applications sent per day over the trailing N days (for trends). */
    applicationsTrend: { date: string; count: number }[];
    /** Real response metrics using firstResponseAt. */
    responses: {
      responses: number;
      awaitingReply: number;
      /** % of submitted apps that got a real response. */
      responseRate: number | null;
      /** Mean days between apply and first response (null if none yet). */
      avgDaysToFirstResponse: number | null;
      days7: number;
      days14: number;
      days30: number;
    };
    /** Open offers awaiting a decision. */
    offersOpen: {
      id: string;
      roleTitle: string | null;
      companyName: string | null;
      offerAmount: number | null;
      offerCurrency: string;
      offerFrequency: string;
      offerStatus: string | null;
    }[];
  };
}
