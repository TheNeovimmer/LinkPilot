import { ApiError } from '../../utils/ApiError';
import { auditService } from '../audit/service';
import { getAiClient } from './config';
import { buildDraftMessages, buildRewriteMessages } from '../../prompts/draftReply';
import { buildAnalyzeJobMessages, jobAnalysisSchema, type JobAnalysis } from '../../prompts/analyzeJob';
import { buildInterviewPrepMessages, interviewPrepSchema, type InterviewPrep } from '../../prompts/interviewPrep';
import { buildSummaryMessages, conversationSummarySchema, type ConversationSummary } from '../../prompts/summarize';
import type { ProfileContext } from '../../prompts/system';
import type { DraftHistoryItem } from '../../prompts/draftReply';
import type { AiDraftResult } from './types';

/**
 * Minimal structural contracts for the repositories the AI service needs.
 * Real implementations are injected by the router (dependency injection).
 */
export interface AiConversation {
  id: string;
  contactName: string;
  contactHeadline?: string | null;
  company?: { name: string } | null;
  recruiter?: { name: string; title?: string | null } | null;
}

export interface AiJob {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  remote?: boolean;
  salaryMin?: number | null;
  salaryMax?: number | null;
  company?: { name: string } | null;
}

export interface AiInterview {
  id: string;
  title: string;
  mode: string;
  scheduledAt: Date;
  job?: AiJob | null;
  recruiter?: { name: string } | null;
}

export interface AiDeps {
  getConversation: (userId: string, id: string) => Promise<AiConversation | null>;
  getLastMessages: (userId: string, conversationId: string, n: number) => Promise<DraftHistoryItem[]>;
  getJob: (userId: string, id: string) => Promise<AiJob | null>;
  updateJobAnalysis: (userId: string, id: string, fitScore: number, analysis: JobAnalysis) => Promise<void>;
  getInterview: (userId: string, id: string) => Promise<AiInterview | null>;
  updateInterviewPrep: (userId: string, id: string, prep: InterviewPrep) => Promise<void>;
  getProfile: (userId: string) => Promise<ProfileContext | null>;
}

export class AiService {
  constructor(private readonly deps: AiDeps) {}

  /** Stream a drafted reply for a conversation. onDelta receives text chunks. */
  async draftReply(
    userId: string,
    input: { conversationId: string; extraContext?: string; tone?: string; signal?: AbortSignal },
    onDelta?: (delta: string) => void,
  ): Promise<AiDraftResult> {
    const [conversation, profile] = await Promise.all([
      this.deps.getConversation(userId, input.conversationId),
      this.deps.getProfile(userId),
    ]);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    const client = await getAiClient(userId);
    if (!client.isConfigured()) throw ApiError.aiNotConfigured();

    const history = await this.deps.getLastMessages(userId, conversation.id, 12);
    const messages = buildDraftMessages({
      profile,
      contact: {
        contactName: conversation.contactName,
        contactHeadline: conversation.contactHeadline,
        companyName: conversation.company?.name ?? null,
        recruiterTitle: conversation.recruiter?.title ?? null,
      },
      history,
      extraContext: input.extraContext,
      tone: input.tone,
    });

    const text = await client.streamChat({ messages, signal: input.signal, onDelta });
    await auditService.log(userId, 'ai.draft', 'conversation', conversation.id, { model: client.model });
    return { text, model: client.model, provider: client.baseUrl };
  }

  /** Rewrite a draft the user already wrote (tone / clarity / length). */
  async rewrite(
    userId: string,
    input: { text: string; tone?: string; instruction?: string; signal?: AbortSignal },
    onDelta?: (delta: string) => void,
  ): Promise<AiDraftResult> {
    const client = await getAiClient(userId);
    if (!client.isConfigured()) throw ApiError.aiNotConfigured();
    const profile = await this.deps.getProfile(userId);
    const messages = buildRewriteMessages({ profile, ...input });
    const text = await client.streamChat({ messages, signal: input.signal, onDelta });
    await auditService.log(userId, 'ai.draft', 'conversation', undefined, { action: 'rewrite', model: client.model });
    return { text, model: client.model, provider: client.baseUrl };
  }

  /** Analyze a job posting: fit score, strengths, gaps, questions. Persists the result. */
  async analyzeJob(userId: string, jobId: string): Promise<JobAnalysis & { jobId: string }> {
    const job = await this.deps.getJob(userId, jobId);
    if (!job) throw ApiError.notFound('Job not found');
    const client = await getAiClient(userId);
    if (!client.isConfigured()) throw ApiError.aiNotConfigured();

    const analysis = await client.chatJSON({
      messages: buildAnalyzeJobMessages({
        title: job.title,
        companyName: job.company?.name ?? null,
        location: job.location,
        remote: job.remote,
        salary: { min: job.salaryMin, max: job.salaryMax },
        description: job.description,
      }),
      schema: jobAnalysisSchema,
    });

    await this.deps.updateJobAnalysis(userId, job.id, analysis.fitScore, analysis);
    await auditService.log(userId, 'job.analyze', 'job', job.id, { fitScore: analysis.fitScore });
    return { ...analysis, jobId: job.id };
  }

  /** Prepare for an interview round. Persists the prep. */
  async prepareInterview(userId: string, interviewId: string): Promise<InterviewPrep & { interviewId: string }> {
    const interview = await this.deps.getInterview(userId, interviewId);
    if (!interview) throw ApiError.notFound('Interview not found');
    const client = await getAiClient(userId);
    if (!client.isConfigured()) throw ApiError.aiNotConfigured();

    const prep = await client.chatJSON({
      messages: buildInterviewPrepMessages({
        title: interview.title,
        mode: interview.mode,
        scheduledAt: interview.scheduledAt.toISOString(),
        jobTitle: interview.job?.title ?? null,
        companyName: interview.job?.company?.name ?? null,
        recruiterName: interview.recruiter?.name ?? null,
        jobDescription: interview.job?.description ?? null,
      }),
      schema: interviewPrepSchema,
    });

    await this.deps.updateInterviewPrep(userId, interview.id, prep);
    await auditService.log(userId, 'interview.prep', 'interview', interview.id);
    return { ...prep, interviewId: interview.id };
  }

  /** Summarize a conversation. */
  async summarizeConversation(userId: string, conversationId: string): Promise<ConversationSummary> {
    const conversation = await this.deps.getConversation(userId, conversationId);
    if (!conversation) throw ApiError.notFound('Conversation not found');
    const client = await getAiClient(userId);
    if (!client.isConfigured()) throw ApiError.aiNotConfigured();

    const history = await this.deps.getLastMessages(userId, conversation.id, 30);
    if (history.length === 0) throw ApiError.badRequest('Conversation has no messages to summarize');

    const summary = await client.chatJSON({
      messages: buildSummaryMessages({ contactName: conversation.contactName, history }),
      schema: conversationSummarySchema,
    });

    await auditService.log(userId, 'ai.summarize', 'conversation', conversation.id);
    return summary;
  }
}
