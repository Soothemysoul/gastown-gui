const SAFE_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;

export class SafeSegment {
  constructor(value, { label = 'segment', maxLength = 128 } = {}) {
    if (!SafeSegment.isValid(value, { maxLength })) {
      throw new Error(`Invalid ${label}`);
    }
    this.value = value;
    Object.freeze(this);
  }

  static isValid(value, { maxLength = 128 } = {}) {
    if (typeof value !== 'string' || value.length === 0 || value.length > maxLength) return false;
    if (value === '.' || value === '..') return false;
    return SAFE_SEGMENT_RE.test(value);
  }

  toString() {
    return this.value;
  }
}

