import { describe, it, expect } from 'vitest';

import { BDGateway } from '../../server/gateways/BDGateway.js';

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

describe('BDGateway', () => {
  it('sets BEADS_DIR and cwd for exec', async () => {
    const runner = new FakeRunner();
    const gateway = new BDGateway({ runner, gtRoot: '/tmp/gt' });

    await gateway.exec(['version']);

    expect(runner.calls[0].command).toBe('bd');
    expect(runner.calls[0].options.cwd).toBe('/tmp/gt');
    expect(runner.calls[0].options.env).toEqual({ BEADS_DIR: '/tmp/gt/.beads' });
  });

  it('list() builds args and parses JSON', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: '[]', stderr: '', error: null, signal: null });
    const gateway = new BDGateway({ runner, gtRoot: '/tmp/gt' });

    const result = await gateway.list({ status: 'open' });

    expect(runner.calls[0].args).toEqual(['--no-daemon', 'list', '--status=open', '--json']);
    expect(result.data).toEqual([]);
  });

  it('search() uses list when query is empty', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: '[]', stderr: '', error: null, signal: null });
    const gateway = new BDGateway({ runner, gtRoot: '/tmp/gt' });

    await gateway.search('');
    expect(runner.calls[0].args).toEqual(['--no-daemon', 'list', '--json']);
  });

  it('create() builds args and extracts beadId', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: 'Created bead: gt-abc123\n', stderr: '', error: null, signal: null });
    const gateway = new BDGateway({ runner, gtRoot: '/tmp/gt' });

    const result = await gateway.create({
      title: 'Fix login bug',
      description: 'Steps to repro…',
      priority: 'P1',
      labels: ['bug', 'ui'],
    });

    expect(runner.calls[0].args).toEqual([
      '--no-daemon',
      'new',
      'Fix login bug',
      '--description',
      'Steps to repro…',
      '--priority',
      'P1',
      '--label',
      'bug',
      '--label',
      'ui',
    ]);
    expect(result.beadId).toBe('gt-abc123');
  });

  it('markDone() adds -m when summary provided', async () => {
    const runner = new FakeRunner();
    runner.queue({ ok: true, exitCode: 0, stdout: 'done', stderr: '', error: null, signal: null });
    const gateway = new BDGateway({ runner, gtRoot: '/tmp/gt' });

    await gateway.markDone({ beadId: 'bd-1', summary: 'ok' });
    expect(runner.calls[0].args).toEqual(['done', 'bd-1', '-m', 'ok']);
  });
});
