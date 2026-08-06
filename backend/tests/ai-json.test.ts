import { describe, expect, it } from 'vitest';
import { extractJson } from '../src/utils/ai-json.js';

describe('extractJson', () => {
  it('parses bare JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON inside markdown fences', () => {
    const text = 'Sure, here you go:\n```json\n{"fitScore": 88, "strengths": ["a", "b"]}\n```\nHope that helps!';
    expect(extractJson(text)).toEqual({ fitScore: 88, strengths: ['a', 'b'] });
  });

  it('parses JSON after preamble text', () => {
    expect(extractJson('Here is the analysis: {"ok": true}')).toEqual({ ok: true });
  });

  it('parses arrays', () => {
    expect(extractJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('handles nested braces and strings with braces', () => {
    const text = '{"q": "write {code} like this", "nested": {"deep": [1, {"x": "}"}]}}';
    expect(extractJson(text)).toEqual({ q: 'write {code} like this', nested: { deep: [1, { x: '}' }] } });
  });

  it('throws on empty input', () => {
    expect(() => extractJson('')).toThrow();
    expect(() => extractJson('no json here')).toThrow();
  });

  it('throws on unbalanced JSON', () => {
    expect(() => extractJson('{"a":')).toThrow();
  });
});
