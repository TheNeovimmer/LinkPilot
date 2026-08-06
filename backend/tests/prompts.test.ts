import { describe, expect, it } from 'vitest';
import { buildDraftMessages, buildRewriteMessages } from '../src/prompts/draftReply.js';
import { buildSystemPrompt } from '../src/prompts/system.js';
import { jobAnalysisSchema } from '../src/prompts/analyzeJob.js';
import { interviewPrepSchema } from '../src/prompts/interviewPrep.js';
import { conversationSummarySchema } from '../src/prompts/summarize.js';

describe('system prompt', () => {
  it('includes profile context and anti-spam rules', () => {
    const prompt = buildSystemPrompt({ displayName: 'Alex', title: 'Engineer', goals: { targetRole: 'Staff' }, tone: 'concise' });
    expect(prompt).toContain('Alex');
    expect(prompt).toContain('Engineer');
    expect(prompt).toContain('DRAFT');
    expect(prompt).toContain('concise');
  });
});

describe('draft reply prompt', () => {
  it('maps message roles to conversation speakers and injects memory', () => {
    const messages = buildDraftMessages({
      profile: null,
      contact: { contactName: 'Priya', companyName: 'Northwind' },
      history: [
        { role: 'THEM', content: 'Are you free Thursday?' },
        { role: 'ME', content: 'Yes!' },
      ],
    });
    expect(messages[0]!.role).toBe('system');
    expect(messages[1]!.content).toContain('Them: Are you free Thursday?');
    expect(messages[1]!.content).toContain('You: Yes!');
    expect(messages[1]!.content).toContain('Northwind');
  });

  it('handles empty history', () => {
    const messages = buildDraftMessages({ profile: null, contact: { contactName: 'X' }, history: [] });
    expect(messages[1]!.content).toContain('No prior messages');
  });
});

describe('rewrite prompt', () => {
  it('embeds the original text and tone', () => {
    const messages = buildRewriteMessages({ profile: null, text: 'hi', tone: 'confident' });
    expect(messages[1]!.content).toContain('hi');
    expect(messages[1]!.content).toContain('confident');
  });
});

describe('structured output schemas', () => {
  it('validate realistic model output', () => {
    const job = jobAnalysisSchema.parse({
      fitScore: 82,
      summary: 'Good fit.',
      strengths: ['K8s'],
      gaps: [],
      questions: [],
      nextSteps: ['Apply'],
    });
    expect(job.fitScore).toBe(82);

    const prep = interviewPrepSchema.parse({
      overview: 'System design round',
      topics: ['Caching'],
      likelyQuestions: [{ question: 'Design a rate limiter', sampleAnswer: 'Token bucket…' }],
      tips: ['Ask clarifying questions'],
      questionsToAsk: ['Team size?'],
    });
    expect(prep.likelyQuestions).toHaveLength(1);

    const summary = conversationSummarySchema.parse({
      summary: 'Recruiter reached out.',
      keyFacts: ['Thursday 2pm'],
      relationshipHealth: 'warm',
      suggestedNextStep: 'Confirm invite',
    });
    expect(summary.relationshipHealth).toBe('warm');
  });

  it('rejects out-of-range fit scores', () => {
    expect(() => jobAnalysisSchema.parse({ fitScore: 150, summary: '', strengths: [], gaps: [], questions: [], nextSteps: [] })).toThrow();
  });
});
