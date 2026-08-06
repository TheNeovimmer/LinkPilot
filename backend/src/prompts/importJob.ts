import { z } from 'zod';

/** Structured fields extracted from a pasted job posting (URL or raw text). */
export const importJobSchema = z.object({
  title: z.string().min(1),
  companyName: z.string().min(1).nullable().optional(),
  location: z.string().nullable().optional(),
  remote: z.boolean().default(false),
  salaryMin: z.number().int().nonnegative().nullable().optional(),
  salaryMax: z.number().int().nonnegative().nullable().optional(),
  url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type ImportJob = z.infer<typeof importJobSchema>;

export function buildImportJobMessages(input: { text: string }): { role: 'system' | 'user'; content: string }[] {
  return [
    {
      role: 'system',
      content: [
        'You extract job postings into structured JSON.',
        'Rules:',
        '- title: the job title. Required.',
        '- companyName: the hiring company. null if unknown.',
        '- location: city/region. Use "Remote" only if fully remote; otherwise null if unknown.',
        '- remote: true only when the posting explicitly says remote/hybrid.',
        '- salaryMin/salaryMax: numeric yearly salary in USD if stated. null if not.',
        '- url: the posting URL if present in the text; otherwise null.',
        '- description: keep the full job description text, cleaned of navigation/boilerplate. null if none.',
        'Respond with JSON only.',
      ].join('\n'),
    },
    { role: 'user', content: input.text },
  ];
}
