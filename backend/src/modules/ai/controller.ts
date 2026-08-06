import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ok } from '../../utils/response.js';
import { aiClient } from './client.js';
import type { AiService } from './service.js';

/** SSE preamble — must be written before streaming starts. */
function startSse(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
}

function sse(res: Response, payload: Record<string, unknown>): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export class AiController {
  constructor(private readonly service: AiService) {}

  /** POST /api/v1/ai/draft-reply → SSE stream of the drafted reply. */
  draftReply = asyncHandler(async (req: Request, res: Response) => {
    if (!aiClient.isConfigured()) {
      // Must fail BEFORE writing SSE headers so the client gets a JSON error.
      return res.status(503).json({
        success: false,
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'AI is not configured. Set AI_API_KEY (and AI_BASE_URL) in the backend environment.',
        },
      });
    }

    startSse(res);
    req.on('close', () => res.end());

    try {
      const result = await this.service.draftReply(
        req.user!.id,
        {
          conversationId: req.body.conversationId,
          extraContext: req.body.extraContext,
          tone: req.body.tone,
          signal: req.signal,
        },
        (delta) => sse(res, { type: 'delta', text: delta }),
      );
      sse(res, { type: 'done', ...result });
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI error';
      sse(res, { type: 'error', message });
      res.end();
    }
  });

  /** POST /api/v1/ai/rewrite → SSE stream of the rewritten draft. */
  rewrite = asyncHandler(async (req: Request, res: Response) => {
    if (!aiClient.isConfigured()) {
      return res.status(503).json({
        success: false,
        error: { code: 'AI_NOT_CONFIGURED', message: 'AI is not configured. Set AI_API_KEY in the backend environment.' },
      });
    }
    startSse(res);
    req.on('close', () => res.end());
    try {
      const result = await this.service.rewrite(
        req.user!.id,
        { text: req.body.text, tone: req.body.tone, instruction: req.body.instruction, signal: req.signal },
        (delta) => sse(res, { type: 'delta', text: delta }),
      );
      sse(res, { type: 'done', ...result });
      res.end();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI error';
      sse(res, { type: 'error', message });
      res.end();
    }
  });

  /** POST /api/v1/ai/analyze-job → JSON job analysis. */
  analyzeJob = asyncHandler(async (req, res) => {
    const result = await this.service.analyzeJob(req.user!.id, req.body.jobId);
    ok(res, result);
  });

  /** POST /api/v1/ai/interview-prep → JSON interview prep. */
  interviewPrep = asyncHandler(async (req, res) => {
    const result = await this.service.prepareInterview(req.user!.id, req.body.interviewId);
    ok(res, result);
  });

  /** POST /api/v1/ai/summarize → JSON conversation summary. */
  summarize = asyncHandler(async (req, res) => {
    const result = await this.service.summarizeConversation(req.user!.id, req.body.conversationId);
    ok(res, result);
  });
}
