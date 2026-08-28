// Mirrors of the backend DTOs. Kept deliberately simple; the backend is the
// source of truth for validation.

export interface Paginated<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export type ConversationStatus = 'ACTIVE' | 'ARCHIVED';

export interface Conversation {
  id: string;
  contactName: string;
  contactLinkedInUrl: string | null;
  contactHeadline: string | null;
  companyId: string | null;
  recruiterId: string | null;
  status: ConversationStatus;
  pinned: boolean;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  companyName: string | null;
  recruiterName: string | null;
}

export type MessageRole = 'ME' | 'THEM' | 'AI';

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export type RecruiterStatus = 'NEW' | 'CONTACTED' | 'RESPONDED' | 'INTERVIEW_SCHEDULED' | 'OFFER' | 'REJECTED' | 'INACTIVE';

export interface Recruiter {
  id: string;
  name: string;
  companyId: string | null;
  companyName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  status: RecruiterStatus;
  lastContactAt: string | null;
  createdAt: string;
  updatedAt: string;
  conversationCount: number;
}

export interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recruiterCount: number;
  jobCount: number;
}

export type JobStatus = 'WATCHLIST' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'CLOSED';

export interface JobAnalysis {
  fitScore: number;
  summary: string;
  strengths: string[];
  gaps: string[];
  questions: string[];
  salaryNote?: string;
  nextSteps: string[];
}

export interface Job {
  id: string;
  companyId: string | null;
  companyName: string | null;
  title: string;
  url: string | null;
  description: string | null;
  location: string | null;
  remote: boolean;
  salaryMin: number | null;
  salaryMax: number | null;
  status: JobStatus;
  fitScore: number | null;
  analysis: JobAnalysis | null;
  postedAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicationCount: number;
  interviewCount: number;
}

export type ApplicationStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'INTERVIEWING' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
export type ApplicationOfferFrequency = 'HOURLY' | 'MONTHLY' | 'YEARLY';
export type ApplicationOfferStatus = 'PENDING' | 'NEGOTIATING' | 'ACCEPTED' | 'DECLINED';

export interface Application {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  roleTitle: string | null;
  status: ApplicationStatus;
  source: string | null;
  firstResponseAt: string | null;
  appliedAt: string | null;
  notes: string | null;
  coverLetter: string | null;
  offerAmount: number | null;
  offerCurrency: string;
  offerFrequency: ApplicationOfferFrequency;
  offerStatus: ApplicationOfferStatus | null;
  offerNotes: string | null;
  createdAt: string;
  updatedAt: string;
  interviewCount: number;
  waitingDays: number | null;
}

export type InterviewMode = 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';

export interface InterviewPrep {
  overview: string;
  topics: string[];
  likelyQuestions: { question: string; sampleAnswer: string }[];
  tips: string[];
  questionsToAsk: string[];
}

export interface Interview {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  mode: InterviewMode;
  status: InterviewStatus;
  location: string | null;
  feedback: string | null;
  prep: InterviewPrep | null;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  recruiterId: string | null;
  recruiterName: string | null;
  applicationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  body: string | null;
  dueAt: string;
  done: boolean;
  remindedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'REMINDER' | 'INTERVIEW' | 'APPLICATION' | 'AI' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface Profile {
  userId: string;
  displayName: string | null;
  title: string | null;
  location: string | null;
  linkedinUrl: string | null;
  tone: 'professional' | 'casual' | 'confident' | 'concise';
  goals: { targetRole?: string; industries?: string[]; salaryRange?: string; priorities?: string[] } | null;
  preferences: Record<string, unknown> | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  updatedAt: string;
}

export interface DashboardStats {
  generatedAt: string;
  conversations: {
    total: number;
    active: number;
    byStatus: Partial<Record<ConversationStatus, number>>;
    recent: { id: string; contactName: string; lastMessageAt: string | null; messageCount: number; status: ConversationStatus }[];
    messagesLast7Days: number;
  };
  recruiters: Partial<Record<RecruiterStatus, number>> & { total: number };
  jobs: Partial<Record<JobStatus, number>> & { total: number; avgFitScore: number | null };
  applications: Partial<Record<ApplicationStatus, number>> & { total: number };
  interviews: {
    upcoming: { id: string; title: string; scheduledAt: string; mode: InterviewMode; companyName: string | null }[];
    completed: number;
  };
  reminders: { overdue: number; dueNext48h: number };
  analytics: {
    funnel: { submitted: number; interviewing: number; offers: number; accepted: number; rejected: number };
    applicationsTrend: { date: string; count: number }[];
    responses: {
      responses: number;
      awaitingReply: number;
      responseRate: number | null;
      avgDaysToFirstResponse: number | null;
      days7: number;
      days14: number;
      days30: number;
    };
    offersOpen: {
      id: string;
      roleTitle: string | null;
      companyName: string | null;
      offerAmount: number | null;
      offerCurrency: string;
      offerFrequency: ApplicationOfferFrequency;
      offerStatus: ApplicationOfferStatus | null;
    }[];
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
}
