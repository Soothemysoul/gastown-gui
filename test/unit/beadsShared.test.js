import { describe, expect, it } from 'vitest';

import { DEFAULT_BEAD_PRIORITY, getBeadPriority } from '../../js/shared/beads.js';

describe('beads shared', () => {
  it('defaults missing/invalid priorities', () => {
    expect(DEFAULT_BEAD_PRIORITY).toBe(2);
    expect(getBeadPriority()).toBe(2);
    expect(getBeadPriority(null)).toBe(2);
    expect(getBeadPriority({})).toBe(2);
    expect(getBeadPriority({ priority: 0 })).toBe(2);
    expect(getBeadPriority({ priority: 'nope' })).toBe(2);
  });

  it('normalizes numeric and numeric-string priorities', () => {
    expect(getBeadPriority({ priority: 5 })).toBe(5);
    expect(getBeadPriority({ priority: '4' })).toBe(4);
  });
});

