import type { Application, ApplicationStatus } from '@prisma/client';

export type { ApplicationStatus };

export interface ApplicationDTO {
  id: string;
  jobId: string | null;
  jobTitle: string | null;
  companyName: string | null;
  roleTitle: string | null;
  status: ApplicationStatus;
  appliedAt: Date | null;
  notes: string | null;
  coverLetter: string | null;
  createdAt: Date;
  updatedAt: Date;
  interviewCount: number;
}

export interface ApplicationPipelineStats {
  byStatus: Record<ApplicationStatus, number>;
  total: number;
  active: number;
}

export type ApplicationRecord = Application;
