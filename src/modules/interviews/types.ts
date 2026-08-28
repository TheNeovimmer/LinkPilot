import type { Interview, InterviewMode, InterviewStatus } from '@prisma/client';
import type { InterviewPrep } from '../../prompts/interviewPrep';

export type { InterviewMode, InterviewStatus };

export interface InterviewDTO {
  id: string;
  title: string;
  scheduledAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export type InterviewRecord = Interview;
