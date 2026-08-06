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
}
