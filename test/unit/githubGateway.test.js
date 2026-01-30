import { describe, it, expect } from 'vitest';

import { GitHubGateway } from '../../server/gateways/GitHubGateway.js';

class FakeRunner {
  constructor() {
    this.calls = [];
    this._queue = [];
  }

  queue(result) {
    this._queue.push(result);
  }

  async exec(command, args, options) {
    this.calls.push({ command, args, options });
    return this._queue.shift() ?? { ok: true, exitCode: 0, stdout: '', stderr: '', error: null, signal: null };
  }
}

describe('GitHubGateway', () => {
  it('getDefaultBranch() calls gh api and returns branch', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: 'main\n', stderr: '', error: null, signal: null });
    const gateway = new GitHubGateway({ runner });

    const result = await gateway.getDefaultBranch({ owner: 'o', repo: 'r' });

    expect(runner.calls[0].command).toBe('gh');
    expect(runner.calls[0].args).toEqual(['api', 'repos/o/r', '--jq', '.default_branch']);
    expect(result.branch).toBe('main');
  });

  it('listPullRequests() builds args and parses JSON', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: '[]', stderr: '', error: null, signal: null });
    const gateway = new GitHubGateway({ runner });

    const result = await gateway.listPullRequests({ repo: 'o/r', state: 'open', limit: 2 });

    expect(runner.calls[0].args).toContain('--repo');
    expect(runner.calls[0].args).toContain('o/r');
    expect(result.data).toEqual([]);
  });

  it('viewIssue() builds args and parses JSON', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: '{"number":1}', stderr: '', error: null, signal: null });
    const gateway = new GitHubGateway({ runner });

    const result = await gateway.viewIssue({ repo: 'o/r', number: 1 });

    expect(runner.calls[0].args[0]).toBe('issue');
    expect(runner.calls[0].args[1]).toBe('view');
    expect(result.data).toEqual({ number: 1 });
  });
});

