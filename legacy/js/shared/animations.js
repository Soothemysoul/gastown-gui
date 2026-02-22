/**
 * Gas Town GUI - Shared animation helpers
 */

export const MAX_STAGGER_INDEX = 6;

export function getStaggerIndex(index, max = MAX_STAGGER_INDEX) {
  const value = Number(index);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(value, max);
}

export function getStaggerClass(index, max = MAX_STAGGER_INDEX) {
  return `stagger-${getStaggerIndex(index, max)}`;
}

