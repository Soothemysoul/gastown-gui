/**
 * Gas Town GUI - Formatting Utilities
 *
 * Common formatting functions for dates, numbers, etc.
 */

export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Unknown';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / TIME_MS.SECOND);
  const diffMin = Math.floor(diffMs / TIME_MS.MINUTE);
  const diffHour = Math.floor(diffMs / TIME_MS.HOUR);
  const diffDay = Math.floor(diffMs / TIME_MS.DAY);

  if (diffSec < 60) {
    return 'just now';
  } else if (diffMin < 60) {
    return `${diffMin}m ago`;
  } else if (diffHour < 24) {
    return `${diffHour}h ago`;
  } else if (diffDay < 7) {
    return `${diffDay}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Compact time-ago formatting for dashboards (e.g., "5m ago", "2d ago")
 */
export function formatTimeAgoCompact(timestamp, { justNowLabel = 'just now' } = {}) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  if (diffMs < TIME_MS.MINUTE) return justNowLabel;
  if (diffMs < TIME_MS.HOUR) return `${Math.floor(diffMs / TIME_MS.MINUTE)}m ago`;
  if (diffMs < TIME_MS.DAY) return `${Math.floor(diffMs / TIME_MS.HOUR)}h ago`;
  return `${Math.floor(diffMs / TIME_MS.DAY)}d ago`;
}

/**
 * Compact time-ago formatting that falls back to a locale date string after 24h.
 */
export function formatTimeAgoOrDate(timestamp, { justNowLabel = 'just now' } = {}) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  if (diffMs < TIME_MS.MINUTE) return justNowLabel;
  if (diffMs < TIME_MS.HOUR) return `${Math.floor(diffMs / TIME_MS.MINUTE)}m ago`;
  if (diffMs < TIME_MS.DAY) return `${Math.floor(diffMs / TIME_MS.HOUR)}h ago`;
  return date.toLocaleDateString();
}

/**
 * Timestamp formatting used in the activity feed: seconds → minutes → time → date.
 */
export function formatActivityFeedTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;

  // Less than 1 minute
  if (diffMs < TIME_MS.MINUTE) {
    const seconds = Math.floor(diffMs / TIME_MS.SECOND);
    return seconds <= 5 ? 'Just now' : `${seconds}s ago`;
  }

  // Less than 1 hour
  if (diffMs < TIME_MS.HOUR) {
    return `${Math.floor(diffMs / TIME_MS.MINUTE)}m ago`;
  }

  // Less than 24 hours - show time
  if (diffMs < TIME_MS.DAY) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Otherwise show date
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

/**
 * Format a date as short date/time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return 'Unknown';

  const date = new Date(dateStr);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a number with commas
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}
