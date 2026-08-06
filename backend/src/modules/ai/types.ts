import type { JobAnalysis } from '../../prompts/analyzeJob.js';
import type { InterviewPrep } from '../../prompts/interviewPrep.js';
import type { ConversationSummary } from '../../prompts/summarize.js';
import type { ProfileContext } from '../../prompts/system.js';
import type { DraftHistoryItem } from '../../prompts/draftReply.js';

export type {
  JobAnalysis,
  InterviewPrep,
  ConversationSummary,
  ProfileContext,
  DraftHistoryItem,
};

export interface AiDraftResult {
  text: string;
  model: string;
  provider: string;
}

export type { ToolCall, ToolDef, ChatMessage } from './client.js';
