/**
 * Gas Town GUI - Close reason parsing
 *
 * Converts "close_reason" free text into safe HTML with links for common patterns.
 */

import { escapeHtml } from '../utils/html.js';
import { getGitHubRepoForBead } from './github-repos.js';

/**
 * Parse close_reason for commit/PR references and make them clickable.
 * @param {string} text
 * @param {string} beadId
 * @returns {string}
 */
export function parseCloseReason(text, beadId) {
  if (!text) return '';

  let result = escapeHtml(text);
  const repo = getGitHubRepoForBead(beadId);

  // Replace commit references with links
  result = result.replace(/commit\s+([a-f0-9]{7,40})/gi, (match, hash) => {
    if (repo) {
      // Link to actual GitHub commit
      const url = `https://github.com/${repo}/commit/${hash}`;
      return `<a href="${url}" target="_blank" class="commit-link" data-commit="${hash}" title="View on GitHub">${match}</a>`;
    }
    // Fallback: copy to clipboard
    return `<a href="#" class="commit-link commit-copy" data-commit="${hash}" title="Click to copy">${match}</a>`;
  });

  // Replace PR references with links
  result = result.replace(/PR\s*#?(\d+)/gi, (match, num) => {
    if (repo) {
      // Link to actual GitHub PR
      const url = `https://github.com/${repo}/pull/${num}`;
      return `<a href="${url}" target="_blank" class="pr-link" data-pr="${num}" title="View on GitHub">${match}</a>`;
    }
    // Fallback: copy to clipboard
    return `<a href="#" class="pr-link pr-copy" data-pr="${num}" title="Click to copy">${match}</a>`;
  });

  return result;
}
