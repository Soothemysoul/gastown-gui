import { describe, it, expect } from 'vitest';

import { GitGateway } from '../../server/gateways/GitGateway.js';

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

describe('GitGateway', () => {
  it('getRemoteOriginUrl() calls git -C and returns url', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: 'https://github.com/o/r.git\n', stderr: '', error: null, signal: null });
    const gateway = new GitGateway({ runner });

    const result = await gateway.getRemoteOriginUrl({ repoDir: '/tmp/repo' });

    expect(runner.calls[0].command).toBe('git');
    expect(runner.calls[0].args).toEqual(['-C', '/tmp/repo', 'remote', 'get-url', 'origin']);
    expect(result.url).toBe('https://github.com/o/r.git');
  });
});

