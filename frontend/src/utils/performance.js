/**
 * Gas Town GUI - Performance Utilities
 *
 * Utilities for optimizing rendering and reducing jank.
 */

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 */
export function debounce(fn, delay = 200) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Minimum time between calls in ms
 */
export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoize function results
 */
export function memoize(fn, keyFn = JSON.stringify) {
  const cache = new Map();
  return (...args) => {
    const key = keyFn(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Performance measurement utilities
 */
export const perf = {
  marks: new Map(),

  start(name) {
    this.marks.set(name, performance.now());
  },

  end(name, log = true) {
    const start = this.marks.get(name);
    if (!start) return 0;

    const duration = performance.now() - start;
    this.marks.delete(name);

    if (log) {
      console.log(`[Perf] ${name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  },

  measure(name, fn) {
    this.start(name);
    const result = fn();
    this.end(name);
    return result;
  },

  async measureAsync(name, fn) {
    this.start(name);
    const result = await fn();
    this.end(name);
    return result;
  },
};
