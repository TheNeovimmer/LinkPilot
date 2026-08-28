import type { ChatMessage } from '../modules/ai/client';
import type { ProfileContext } from './system';
import { buildSystemPrompt } from './system';

export interface DraftContext {
  contactName: string;
  contactHeadline?: string | null;
  companyName?: string | null;
  recruiterTitle?: string | null;
}

export interface DraftHistoryItem {
  role: 'ME' | 'THEM' | 'AI';
  content: string;
}

/**
 * Builds the message list for drafting a reply:
 * system prompt (identity + rules) → conversation memory → instruction.
 */
export function buildDraftMessages(opts: {
  profile: ProfileContext | null;
  contact: DraftContext;
  history: DraftHistoryItem[];
  extraContext?: string;
  tone?: string;
}): ChatMessage[] {
  const { profile, contact, history, extraContext, tone } = opts;

  const contextLines: string[] = [];
  if (contact.contactHeadline) contextLines.push(`Contact headline: ${contact.contactHeadline}`);
  if (contact.recruiterTitle) contextLines.push(`Contact role: ${contact.recruiterTitle}`);
  if (contact.companyName) contextLines.push(`Their company: ${contact.companyName}`);

  const memory =
    history.length === 0
      ? '(No prior messages in this conversation yet.)'
      : history
          .map((m) => {
            const who = m.role === 'ME' ? 'You' : m.role === 'THEM' ? 'Them' : 'Your assistant';
            return `${who}: ${m.content}`;
          })
          .join('\n');

  const toneLine = tone ? `Write in this tone: ${tone}.` : '';

  const userInstruction = [
    'Draft the next message you would send in this LinkedIn conversation.',
    'Write it as a single message ready to paste into LinkedIn. Do not include subject lines, labels, or explanations outside the message.',
    contextLines.length ? contextLines.join('\n') : '',
    `Recent conversation:\n${memory}`,
    extraContext ? `Additional context from the owner: ${extraContext}` : '',
    toneLine,
  ]
    .filter(Boolean)
    .join('\n\n');

  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    { role: 'user', content: userInstruction },
  ];
}

/** Rewrite a draft the user already wrote (tone / clarity / length). */
export function buildRewriteMessages(opts: {
  profile: ProfileContext | null;
  text: string;
  tone?: string;
  instruction?: string;
}): ChatMessage[] {
  const { profile, text, tone, instruction } = opts;
  return [
    { role: 'system', content: buildSystemPrompt(profile) },
    {
      role: 'user',
      content: [
        'Rewrite the following draft message for a LinkedIn conversation. Keep the intent and facts, improve tone and clarity.',
        instruction ? `Instruction: ${instruction}` : '',
        tone ? `Target tone: ${tone}` : '',
        `Draft:\n"""\n${text}\n"""`,
        'Output only the rewritten message, no commentary.',
      ]
        .filter(Boolean)
        .join('\n\n'),
    },
  ];
}
