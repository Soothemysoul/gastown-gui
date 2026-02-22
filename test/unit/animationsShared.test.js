import { describe, expect, it } from 'vitest';

import { MAX_STAGGER_INDEX, getStaggerClass, getStaggerIndex } from '../../legacy/js/shared/animations.js';

describe('animations shared', () => {
  it('caps stagger index to MAX_STAGGER_INDEX', () => {
    expect(MAX_STAGGER_INDEX).toBe(6);
    expect(getStaggerIndex(0)).toBe(0);
    expect(getStaggerIndex(1)).toBe(1);
    expect(getStaggerIndex(999)).toBe(6);
  });

  it('normalizes invalid values', () => {
    expect(getStaggerIndex()).toBe(0);
    expect(getStaggerIndex(null)).toBe(0);
    expect(getStaggerIndex('nope')).toBe(0);
    expect(getStaggerIndex(-1)).toBe(0);
  });

  it('returns the expected class', () => {
    expect(getStaggerClass(0)).toBe('stagger-0');
    expect(getStaggerClass(6)).toBe('stagger-6');
    expect(getStaggerClass(7)).toBe('stagger-6');
  });
});

