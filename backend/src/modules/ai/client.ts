import { z } from 'zod';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { extractJson } from '../../utils/ai-json.js';
import { logger } from '../../utils/logger.js';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ToolDef {
  type: 'function';
  function: { name: string; description: string; parameters: Record<string, unknown> };
}

export interface ToolCall {
  name: string;
  arguments: string;
}

export interface StreamOptions {
  messages: ChatMessage[];
  tools?: ToolDef[];
  /** Request response_format json_object (falls back gracefully if unsupported). */
  json?: boolean;
  signal?: AbortSignal;
  onDelta?: (delta: string) => void;
  onToolCall?: (toolCall: ToolCall) => void;
}

interface SSEChoice {
  delta?: { content?: string | null; tool_calls?: (ToolCall & { index?: number })[] };
  message?: { content?: string | null; tool_calls?: ToolCall[] };
  finish_reason?: string | null;
}

/**
 * Minimal OpenAI-compatible chat client (no SDK) — works with OpenCode Zen,
 * OpenAI, and any provider exposing /chat/completions. Supports streaming
 * (SSE), function calling, and JSON mode.
 */
export class AiClient {
  readonly baseUrl = env.AI_BASE_URL.replace(/\/+$/, '');
  readonly model = env.AI_MODEL;

  isConfigured(): boolean {
    return Boolean(env.AI_API_KEY);
  }

  private headers(): Record<string, string> {
    if (!env.AI_API_KEY) throw ApiError.aiNotConfigured();
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_API_KEY}`,
    };
  }

  /** Stream a chat completion. Resolves with the full text; deltas and tool calls arrive via callbacks. */
  async streamChat(opts: StreamOptions): Promise<string> {
    const { messages, tools, json, signal, onDelta, onToolCall } = opts;
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      stream: true,
      temperature: 0.7,
    };
    if (tools?.length) body.tools = tools;
    if (json) body.response_format = { type: 'json_object' };

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: signal ?? AbortSignal.timeout(env.AI_TIMEOUT_MS),
      });

      if (!res.ok) {
        throw ApiError.aiError(await this.readError(res), res.status);
      }
      if (!res.body) throw ApiError.aiError('AI provider returned an empty body');

      return await this.consumeSse(res.body, { onDelta, onToolCall });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') throw ApiError.aiError('AI request timed out or was aborted');
      throw ApiError.aiError((err as Error).message);
    }
  }

  /** Non-streaming structured JSON completion, zod-validated, with one retry. */
  async chatJSON<T>(opts: { messages: ChatMessage[]; schema: z.ZodType<T, z.ZodTypeDef, any>; tools?: ToolDef[] }): Promise<T> {
    const { messages, schema, tools } = opts;
    const attempt = async (withFormat: boolean): Promise<string> => {
      const body: Record<string, unknown> = {
        model: this.model,
        messages,
        stream: false,
        temperature: 0.3,
      };
      if (tools?.length) body.tools = tools;
      if (withFormat) body.response_format = { type: 'json_object' };

      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
      });
      if (!res.ok) throw ApiError.aiError(await this.readError(res), res.status);
      const data = (await res.json()) as { choices?: SSEChoice[] };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw ApiError.aiError('AI returned no content');
      return content;
    };

    let raw: string;
    try {
      raw = await attempt(true);
    } catch (err) {
      // Some providers reject response_format — retry plain text + extraction.
      if (err instanceof ApiError && err.details === 400) raw = await attempt(false);
      else throw err;
    }

    try {
      return schema.parse(extractJson(raw));
    } catch (err) {
      // One corrective retry with the schema error fed back.
      logger.warn('AI JSON parse failed, retrying with feedback', { error: (err as Error).message });
      const corrected = await attempt(false);
      return schema.parse(extractJson(corrected));
    }
  }

  /** Embed text for semantic search. Only works when AI_EMBEDDING_MODEL is set. */
  async embed(text: string): Promise<number[]> {
    if (!env.AI_EMBEDDING_MODEL) throw ApiError.aiNotConfigured('Embedding model not configured (AI_EMBEDDING_MODEL)');
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ model: env.AI_EMBEDDING_MODEL, input: text.slice(0, 8000) }),
      signal: AbortSignal.timeout(env.AI_TIMEOUT_MS),
    });
    if (!res.ok) throw ApiError.aiError(await this.readError(res), res.status);
    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    const embedding = data.data?.[0]?.embedding;
    if (!embedding) throw ApiError.aiError('Embedding provider returned no vector');
    return embedding;
  }

  /** Model id (used by semantic search: must match embedding dimension). */
  get embeddingDim(): number {
    return 1536;
  }

  private async consumeSse(
    stream: ReadableStream<Uint8Array>,
    { onDelta, onToolCall }: { onDelta?: (d: string) => void; onToolCall?: (t: ToolCall) => void },
  ): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    const toolParts = new Map<number, ToolCall>();

    const handleLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) return;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') return;

      let parsed: { choices?: SSEChoice[] };
      try {
        parsed = JSON.parse(payload) as { choices?: SSEChoice[] };
      } catch {
        return;
      }
      const choice = parsed.choices?.[0];
      if (!choice) return;

      if (choice.delta) {
        if (choice.delta.content) {
          fullText += choice.delta.content;
          onDelta?.(choice.delta.content);
        }
        for (const tc of choice.delta.tool_calls ?? []) {
          const idx = tc.index ?? 0;
          const acc = toolParts.get(idx) ?? { name: '', arguments: '' };
          if (tc.name) acc.name += tc.name;
          if (tc.arguments) acc.arguments += tc.arguments;
          toolParts.set(idx, acc);
        }
      } else if (choice.message) {
        if (choice.message.content) {
          fullText += choice.message.content;
          onDelta?.(choice.message.content);
        }
        for (const tc of choice.message.tool_calls ?? []) {
          onToolCall?.(tc);
        }
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) handleLine(line);
    }
    if (buffer) handleLine(buffer);

    // Emit accumulated streaming tool calls.
    for (const tc of toolParts.values()) {
      if (tc.name) onToolCall?.(tc);
    }
    return fullText;
  }

  private async readError(res: Response): Promise<string> {
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      return body.error?.message ?? `AI provider error (HTTP ${res.status})`;
    } catch {
      return `AI provider error (HTTP ${res.status})`;
    }
  }
}

export const aiClient = new AiClient();
