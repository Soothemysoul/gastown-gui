import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { GitHubService } from '../../server/services/GitHubService.js';

describe('GitHubService', () => {
  it('lists PRs across rigs, annotates with rig/repo, sorts, and caches', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });

    const statusService = {
      calls: 0,
      getStatus: async () => {
        statusService.calls++;
        return {
          rigs: [
            { name: 'rig1', git_url: 'https://github.com/acme/one' },
            { name: 'rig2', git_url: 'git@github.com:acme/two.git' },
            { name: 'rig3', git_url: null },
          ],
        };
      },
    };

    const listCalls = [];
    const gitHubGateway = {
      listPullRequests: async ({ repo }) => {
        listCalls.push(repo);
        if (repo === 'acme/one') {
          return { ok: true, data: [{ number: 1, updatedAt: '2020-01-01T00:00:00Z' }] };
        }
        if (repo === 'acme/two') {
          return { ok: true, data: [{ number: 2, updatedAt: '2021-01-01T00:00:00Z' }] };
        }
        return { ok: true, data: [] };
      },
      viewPullRequest: async () => ({ ok: true, data: {} }),
      listIssues: async () => ({ ok: true, data: [] }),
      viewIssue: async () => ({ ok: true, data: {} }),
      listRepos: async () => ({ ok: true, data: [] }),
    };

    const service = new GitHubService({ gitHubGateway, statusService, cache, prsTtlMs: 1000 });

    const first = await service.listPullRequests({ state: 'open' });
    expect(listCalls).toEqual(['acme/one', 'acme/two']);
    expect(first.map(pr => pr.number)).toEqual([2, 1]);
    expect(first[0]).toEqual(expect.objectContaining({ rig: 'rig2', repo: 'acme/two' }));

    const second = await service.listPullRequests({ state: 'open' });
    expect(second.map(pr => pr.number)).toEqual([2, 1]);
    expect(statusService.calls).toBe(1);

    now += 1001;
    await service.listPullRequests({ state: 'open' });
    expect(statusService.calls).toBe(2);
  });

  it('sorts repos by pushedAt descending', async () => {
    const statusService = { getStatus: async () => ({ rigs: [] }) };

    const gitHubGateway = {
      listPullRequests: async () => ({ ok: true, data: [] }),
      viewPullRequest: async () => ({ ok: true, data: {} }),
      listIssues: async () => ({ ok: true, data: [] }),
      viewIssue: async () => ({ ok: true, data: {} }),
      listRepos: async () => ({
        ok: true,
        data: [
          { name: 'old', pushedAt: '2020-01-01T00:00:00Z' },
          { name: 'new', pushedAt: '2021-01-01T00:00:00Z' },
        ],
      }),
    };

    const service = new GitHubService({ gitHubGateway, statusService });
    const repos = await service.listRepos({ limit: 2 });

    expect(repos.map(r => r.name)).toEqual(['new', 'old']);
  });
});

