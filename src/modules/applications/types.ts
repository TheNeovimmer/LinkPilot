import type { Application, ApplicationStatus, ApplicationOfferFrequency, ApplicationOfferStatus } from '@prisma/client';

export type { ApplicationStatus, ApplicationOfferFrequency, ApplicationOfferStatus };

export interface ApplicationDTO {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  roleTitle: string | null;
  status: ApplicationStatus;
  source: string | null;
  firstResponseAt: Date | null;
  appliedAt: Date | null;
  notes: string | null;
  coverLetter: string | null;
  offerAmount: number | null;
  offerCurrency: string;
  offerFrequency: ApplicationOfferFrequency;
  offerStatus: ApplicationOfferStatus | null;
  offerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  interviewCount: number;
  /** Days since applied without a first response (0 when not applicable). */
  waitingDays: number | null;
}

export interface ApplicationPipelineStats {
  byStatus: Record<ApplicationStatus, number>;
  total: number;
  active: number;
}

export type ApplicationRecord = Application;
