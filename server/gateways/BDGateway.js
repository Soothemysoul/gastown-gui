import path from 'node:path';

function parseJsonOrNull(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export class BDGateway {
  constructor({ runner, gtRoot }) {
    if (!runner?.exec) throw new Error('BDGateway requires a runner with exec()');
    if (!gtRoot) throw new Error('BDGateway requires gtRoot');
    this._runner = runner;
    this._gtRoot = gtRoot;
    this._beadsDir = path.join(gtRoot, '.beads');
  }

  async exec(args, options = {}) {
    const env = { BEADS_DIR: this._beadsDir, ...(options.env ?? {}) };
    return this._runner.exec('bd', args, { cwd: this._gtRoot, ...options, env });
  }

  async list({ status } = {}) {
    const args = ['--no-daemon', 'list'];
    if (status) args.push(`--status=${status}`);
    args.push('--json');

    const result = await this.exec(args, { timeoutMs: 30000 });
    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async search(query) {
    const args = ['--no-daemon', query ? 'search' : 'list'];
    if (query) args.push(query);
    args.push('--json');

    const result = await this.exec(args, { timeoutMs: 30000 });
    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async show(beadId) {
    const result = await this.exec(['show', beadId, '--json'], { timeoutMs: 30000 });
    const raw = (result.stdout || '').trim();
    return { ...result, raw, data: parseJsonOrNull(raw) };
  }

  async markDone({ beadId, summary } = {}) {
    const args = ['done', beadId];
    if (summary) args.push('-m', summary);
    const result = await this.exec(args, { timeoutMs: 30000 });
    return { ...result, raw: (result.stdout || '').trim() };
  }

  async park({ beadId, reason } = {}) {
    const args = ['park', beadId];
    if (reason) args.push('-m', reason);
    const result = await this.exec(args, { timeoutMs: 30000 });
    return { ...result, raw: (result.stdout || '').trim() };
  }

  async release(beadId) {
    const result = await this.exec(['release', beadId], { timeoutMs: 30000 });
    return { ...result, raw: (result.stdout || '').trim() };
  }

  async reassign({ beadId, target } = {}) {
    const result = await this.exec(['reassign', beadId, target], { timeoutMs: 30000 });
    return { ...result, raw: (result.stdout || '').trim() };
  }
}

