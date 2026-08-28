import { z } from 'zod';
import type { ChatMessage } from '../modules/ai/client';

export const jobAnalysisSchema = z.object({
  fitScore: z.number().int().min(0).max(100),
  summary: z.string().describe('2-3 sentence take on the role'),
  strengths: z.array(z.string()).describe('ways the owner clearly fits'),
  gaps: z.array(z.string()).describe('skill/experience gaps to address'),
  questions: z.array(z.string()).describe('clarifying questions worth asking before applying'),
  salaryNote: z.string().optional().describe('one line about compensation if mentioned'),
  nextSteps: z.array(z.string()).describe('concrete recommended actions'),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

export function buildAnalyzeJobMessages(opts: {
  title: string;
  companyName?: string | null;
  location?: string | null;
  remote?: boolean;
  salary?: { min?: number | null; max?: number | null };
  description?: string | null;
}): ChatMessage[] {
  const { title, companyName, location, remote, salary, description } = opts;
  const salaryLine =
    salary?.min || salary?.max ? `Salary range: ${salary.min ?? '?'} - ${salary.max ?? '?'}` : 'Salary: not specified';

  return [
    {
      role: 'system',
      content:
        'You analyze job postings for a single job seeker and return a strict JSON object. ' +
        'Be honest and specific. fitScore reflects realistic fit for a professional with the owner\'s profile. ' +
        'Output ONLY valid JSON. Do not wrap it in markdown fences.',
    },
    {
      role: 'user',
      content: [
        `Job title: ${title}`,
        companyName ? `Company: ${companyName}` : 'Company: unknown',
        location ? `Location: ${location}` : '',
        remote ? 'Remote: yes' : '',
        salaryLine,
        description ? `Job description:\n${description}` : 'Job description: not provided — assess from title/company only.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];
}
