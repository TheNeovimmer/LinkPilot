export interface AIStreamEvent {
  type: 'delta' | 'done' | 'error';
  text?: string;
  message?: string;
}

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: (result: { text: string; model?: string; provider?: string }) => void;
  onError: (error: Error) => void;
}

/**
 * POST to an AI SSE endpoint and dispatch delta/done/error events.
 * Returns a promise that resolves when the stream completes.
 */
export async function streamAI(
  path: string,
  body: unknown,
  handlers: StreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
    signal,
  });

  if (!res.ok) {
    let message = `AI request failed (${res.status})`;
    try {
      const json = (await res.json()) as { error?: { message?: string } };
      if (json.error?.message) message = json.error.message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }
  if (!res.body) throw new Error('Empty stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('data:')) return;
    const payload = trimmed.slice(5).trim();
    if (!payload) return;
    let event: AIStreamEvent;
    try {
      event = JSON.parse(payload) as AIStreamEvent;
    } catch {
      return;
    }
    if (event.type === 'delta' && event.text) handlers.onDelta(event.text);
    else if (event.type === 'done' && event.text !== undefined)
      handlers.onDone({ text: event.text, model: (event as { model?: string }).model });
    else if (event.type === 'error') handlers.onError(new Error(event.message ?? 'AI error'));
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
}
