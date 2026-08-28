import { z } from 'zod';
import type { ChatMessage } from '../modules/ai/client';

export const interviewPrepSchema = z.object({
  overview: z.string().describe('what this interview round likely focuses on'),
  topics: z.array(z.string()).describe('topics to review'),
  likelyQuestions: z
    .array(z.object({ question: z.string(), sampleAnswer: z.string().describe('a short sample answer using the STAR shape where useful') }))
    .describe('3-6 likely questions with sample answers'),
  tips: z.array(z.string()).describe('practical tips for this round'),
  questionsToAsk: z.array(z.string()).describe('smart questions to ask the interviewer'),
});

export type InterviewPrep = z.infer<typeof interviewPrepSchema>;

export function buildInterviewPrepMessages(opts: {
  title: string;
  mode: string;
  scheduledAt: string;
  jobTitle?: string | null;
  companyName?: string | null;
  recruiterName?: string | null;
  jobDescription?: string | null;
}): ChatMessage[] {
  const { title, mode, scheduledAt, jobTitle, companyName, recruiterName, jobDescription } = opts;

  return [
    {
      role: 'system',
      content:
        'You prepare a candidate for a job interview round. Return a strict JSON object with overview, topics, likelyQuestions (with sample answers), tips and questionsToAsk. Output ONLY valid JSON, no markdown fences.',
    },
    {
      role: 'user',
      content: [
        `Interview round: ${title}`,
        `Mode: ${mode}`,
        `Scheduled: ${scheduledAt}`,
        jobTitle ? `Role: ${jobTitle}` : '',
        companyName ? `Company: ${companyName}` : '',
        recruiterName ? `Interviewer/host: ${recruiterName}` : '',
        jobDescription ? `Job description:\n${jobDescription}` : '',
        'Prepare concrete, specific prep material for THIS role.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];
}
