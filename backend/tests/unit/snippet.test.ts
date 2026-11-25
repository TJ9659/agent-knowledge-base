import { describe, expect, it } from 'vitest';
import { toSnippet } from '../../src/utils/snippet.js';

describe('toSnippet', () => {
  it('drops the title heading and markdown symbols', () => {
    const markdown = '# Handling a double charge\n\n**When to use:** the customer sees the same charge *twice*.';
    expect(toSnippet(markdown)).toBe('When to use: the customer sees the same charge twice.');
  });

  it('keeps link text and removes list markers', () => {
    expect(toSnippet('- See [the refund policy](/articles/3)\n1. Verify the caller')).toBe('See the refund policy Verify the caller');
  });

  it('cuts long text at a word boundary with an ellipsis', () => {
    const snippet = toSnippet('word '.repeat(100), 20);
    expect(snippet.endsWith('…')).toBe(true);
    expect(snippet.length).toBeLessThanOrEqual(21);
    expect(snippet).not.toContain('wor…');
  });
});
