import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TIME_MS,
  formatActivityFeedTime,
  formatTimeAgoCompact,
  formatTimeAgoOrDate,
} from '../../js/utils/formatting.js';

describe('formatting time helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2020-01-02T03:04:05Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formatTimeAgoCompact returns compact relative times', () => {
    const nowMs = Date.now();

    expect(formatTimeAgoCompact()).toBe('');
    expect(formatTimeAgoCompact(new Date(nowMs - 30 * TIME_MS.SECOND).toISOString())).toBe('just now');
    expect(formatTimeAgoCompact(new Date(nowMs - 5 * TIME_MS.MINUTE).toISOString())).toBe('5m ago');
    expect(formatTimeAgoCompact(new Date(nowMs - 2 * TIME_MS.HOUR).toISOString())).toBe('2h ago');
    expect(formatTimeAgoCompact(new Date(nowMs - 3 * TIME_MS.DAY).toISOString())).toBe('3d ago');
  });

  it('formatTimeAgoCompact allows customizing the just-now label', () => {
    const nowMs = Date.now();
    expect(
      formatTimeAgoCompact(new Date(nowMs - 10 * TIME_MS.SECOND).toISOString(), {
        justNowLabel: 'Just now',
      }),
    ).toBe('Just now');
  });

  it('formatTimeAgoOrDate returns compact relative time for <1 day', () => {
    const nowMs = Date.now();

    expect(formatTimeAgoOrDate()).toBe('');
    expect(formatTimeAgoOrDate(new Date(nowMs - 30 * TIME_MS.SECOND).toISOString())).toBe('just now');
    expect(formatTimeAgoOrDate(new Date(nowMs - 59 * TIME_MS.MINUTE).toISOString())).toBe('59m ago');
    expect(formatTimeAgoOrDate(new Date(nowMs - 2 * TIME_MS.HOUR).toISOString())).toBe('2h ago');
  });

  it('formatActivityFeedTime returns seconds for very recent events', () => {
    const nowMs = Date.now();

    expect(formatActivityFeedTime()).toBe('');
    expect(formatActivityFeedTime(new Date(nowMs - 3 * TIME_MS.SECOND).toISOString())).toBe('Just now');
    expect(formatActivityFeedTime(new Date(nowMs - 10 * TIME_MS.SECOND).toISOString())).toBe('10s ago');
  });

  it('formatActivityFeedTime returns minutes for events <1 hour', () => {
    const nowMs = Date.now();
    expect(formatActivityFeedTime(new Date(nowMs - 12 * TIME_MS.MINUTE).toISOString())).toBe('12m ago');
  });
});

