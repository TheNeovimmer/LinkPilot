import type { Job, JobStatus } from '@prisma/client';
import type { JobAnalysis } from '../../prompts/analyzeJob';

export type { JobStatus };

export interface JobDTO {
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
  postedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  applicationCount: number;
  interviewCount: number;
}

export interface JobStats {
  byStatus: Record<JobStatus, number>;
  total: number;
  analyzed: number;
  avgFitScore: number | null;
}

export type JobRecord = Job;
