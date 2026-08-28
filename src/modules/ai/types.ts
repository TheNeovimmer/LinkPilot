import type { JobAnalysis } from '../../prompts/analyzeJob';
import type { InterviewPrep } from '../../prompts/interviewPrep';
import type { ConversationSummary } from '../../prompts/summarize';
import type { ProfileContext } from '../../prompts/system';
import type { DraftHistoryItem } from '../../prompts/draftReply';

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

export type { ToolCall, ToolDef, ChatMessage } from './client';
