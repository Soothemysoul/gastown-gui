export class GitGateway {
  constructor({ runner }) {
    if (!runner?.exec) throw new Error('GitGateway requires a runner with exec()');
    this._runner = runner;
  }

  async getRemoteOriginUrl({ repoDir } = {}) {
    const result = await this._runner.exec('git', ['-C', repoDir, 'remote', 'get-url', 'origin'], {
      timeoutMs: 5000,
    });
    const url = (result.stdout || '').trim();
    return { ...result, url: url || null };
  }
}

