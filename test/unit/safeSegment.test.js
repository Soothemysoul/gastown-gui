import { describe, it, expect } from 'vitest';

import { SafeSegment } from '../../server/domain/values/SafeSegment.js';

describe('SafeSegment', () => {
  it('accepts typical values', () => {
    expect(new SafeSegment('work1').toString()).toBe('work1');
    expect(new SafeSegment('hytopia-map.compression_v2').toString()).toBe('hytopia-map.compression_v2');
  });

  it('rejects empty, dot, dotdot', () => {
    expect(() => new SafeSegment('')).toThrow(/invalid/i);
    expect(() => new SafeSegment('.')).toThrow(/invalid/i);
    expect(() => new SafeSegment('..')).toThrow(/invalid/i);
  });

  it('rejects path separators and spaces', () => {
    expect(() => new SafeSegment('a/b')).toThrow(/invalid/i);
    expect(() => new SafeSegment('a b')).toThrow(/invalid/i);
  });
});

