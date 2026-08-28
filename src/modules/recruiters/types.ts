import type { Recruiter, RecruiterStatus } from '@prisma/client';

export type { RecruiterStatus };

export interface RecruiterDTO {
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
  lastContactAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  conversationCount: number;
}

export interface RecruiterPipelineStats {
  byStatus: Record<RecruiterStatus, number>;
  total: number;
  contactable: number;
}

export type RecruiterRecord = Recruiter;
