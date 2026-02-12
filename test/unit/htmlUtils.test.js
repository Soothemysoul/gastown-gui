import { describe, it, expect } from 'vitest';

import { escapeAttr, escapeHtml, truncate, capitalize } from '../../js/utils/html.js';

describe('html utils', () => {
  it('escapeHtml escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(0)).toBe('0');
  });

  it('escapeAttr escapes attribute special characters', () => {
    expect(escapeAttr('"\'&<>')).toBe('&quot;&#39;&amp;&lt;&gt;');
    expect(escapeAttr(null)).toBe('');
    expect(escapeAttr(0)).toBe('0');
  });

  it('truncate truncates with ellipsis', () => {
    expect(truncate('hello', 10)).toBe('hello');
    expect(truncate('hello world', 5)).toBe('hello...');
    expect(truncate(null, 5)).toBe('');
    expect(truncate(123456, 3)).toBe('123...');
  });

  it('capitalize capitalizes the first character', () => {
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('')).toBe('');
    expect(capitalize(null)).toBe('');
    expect(capitalize(123)).toBe('123');
  });
});

