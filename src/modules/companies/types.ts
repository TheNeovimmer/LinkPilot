import type { Company } from '@prisma/client';

export interface CompanyDTO {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  location: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  recruiterCount: number;
  jobCount: number;
}

export type CompanyRecord = Company;
