import { afterEach, describe, expect, it } from 'vitest';

import { GITHUB_REPOS, getGitHubRepoForBead } from '../../js/shared/github-repos.js';

function clearRepos() {
  for (const key of Object.keys(GITHUB_REPOS)) {
    delete GITHUB_REPOS[key];
  }
}

describe('github repos', () => {
  afterEach(() => {
    clearRepos();
  });

  it('returns null for empty input', () => {
    expect(getGitHubRepoForBead()).toBe(null);
    expect(getGitHubRepoForBead(null)).toBe(null);
    expect(getGitHubRepoForBead('')).toBe(null);
  });

  it('matches by bead prefix (case-insensitive)', () => {
    GITHUB_REPOS.hq = 'org/hq';
    expect(getGitHubRepoForBead('HQ-123')).toBe('org/hq');
  });

  it('matches by rig key substring', () => {
    GITHUB_REPOS['my-rig'] = 'org/my-rig';
    expect(getGitHubRepoForBead('my-rig-42')).toBe('org/my-rig');
  });

  it('falls back to the first available repo', () => {
    GITHUB_REPOS.foo = '';
    GITHUB_REPOS.bar = null;
    GITHUB_REPOS.baz = 'org/baz';
    expect(getGitHubRepoForBead('unmatched-123')).toBe('org/baz');
  });
});

