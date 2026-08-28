import { z } from 'zod';
import type { ChatMessage } from '../modules/ai/client';

export const conversationSummarySchema = z.object({
  summary: z.string().describe('3-5 sentence summary of the conversation'),
  keyFacts: z.array(z.string()).describe('concrete facts: names, roles, numbers, commitments'),
  relationshipHealth: z.enum(['cold', 'warm', 'hot', 'unknown']),
  suggestedNextStep: z.string().describe('one concrete recommended next action'),
});

export type ConversationSummary = z.infer<typeof conversationSummarySchema>;

export function buildSummaryMessages(opts: { contactName: string; history: { role: string; content: string }[] }): ChatMessage[] {
  const transcript = opts.history
    .map((m) => `${m.role === 'ME' ? 'You' : m.role === 'THEM' ? 'Them' : 'Assistant'}: ${m.content}`)
    .join('\n');

  return [
    {
      role: 'system',
      content:
        'You summarize a private LinkedIn conversation for the account owner. Return a strict JSON object: summary, keyFacts, relationshipHealth (cold|warm|hot|unknown), suggestedNextStep. Output ONLY valid JSON.',
    },
    {
      role: 'user',
      content: `Contact: ${opts.contactName}\n\nConversation:\n${transcript}`,
    },
  ];
}
