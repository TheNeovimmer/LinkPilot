/**
 * Extract a JSON object from a model's text output.
 * Models wrap JSON in ```json fences or preamble text; this finds the first
 * balanced {...} block (or [..] array) and parses it. Used to harden
 * "structured JSON outputs".
 */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty model output');

  // Try a fenced block first.
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1]! : trimmed;

  const start = candidate.indexOf('{');
  const arrayStart = candidate.indexOf('[');
  let from = -1;
  let open = '{';
  if (arrayStart !== -1 && (start === -1 || arrayStart < start)) {
    from = arrayStart;
    open = '[';
  } else if (start !== -1) {
    from = start;
  }
  if (from === -1) throw new Error('No JSON found in model output');

  const depth = { '{': 0, '[': 0 };
  let inString = false;
  let escaped = false;
  let closeIdx = -1;

  for (let i = from; i < candidate.length; i++) {
    const ch = candidate[i]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{' || ch === '[') depth[ch as '{' | '[']++;
    else if (ch === '}') depth['{']--;
    else if (ch === ']') depth['[']--;

    const done = open === '{' ? depth['{'] === 0 && depth['['] === 0 : depth['['] === 0 && depth['{'] === 0;
    if (done) {
      closeIdx = i;
      break;
    }
  }

  if (closeIdx === -1) throw new Error('Unbalanced JSON in model output');
  return JSON.parse(candidate.slice(from, closeIdx + 1)) as T;
}
