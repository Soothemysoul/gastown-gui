export class DoctorService {
  constructor({ gtGateway, cache } = {}) {
    if (!gtGateway) throw new Error('DoctorService requires gtGateway');

    this._gt = gtGateway;
    this._cache = cache ?? null;
  }

  async check({ refresh = false, ttlMs = 30000 } = {}) {
    const key = 'doctor';
    if (!refresh && this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    // gt doctor exits with code 1 when it finds errors (normal behavior)
    const result = await this._gt.exec(['doctor'], {
      timeoutMs: 60000,
      allowExitCodes: [0, 1],
    });
    const rawOutput = (result.stdout || '').trim();

    if (!rawOutput) {
      const response = { checks: [], raw: result.error || 'gt doctor failed', error: result.error };
      this._cache?.set?.(key, response, 10000);
      return response;
    }

    const checks = [];
    for (const line of rawOutput.split('\n')) {
      const checkMatch = line.match(/^\s*[○●]\s+\S+\s+([✓✔✗✘×⚠✖!])\s+(\S+)\s+(.+)$/u);
      if (checkMatch) {
        const [, symbol, checkName, description] = checkMatch;
        const passSyms = '✓✔';
        const warnSyms = '⚠!';
        const status = passSyms.includes(symbol) ? 'pass' : warnSyms.includes(symbol) ? 'warn' : 'fail';
        checks.push({
          id: checkName.trim(),
          name: checkName.trim(),
          description: description.replace(/\r/g, '').trim(),
          status,
          details: [],
          fix: null,
        });
      }
    }

    const summaryMatch = rawOutput.match(/(\d+)\s+passed.*?(\d+)\s+warnings?.*?(\d+)\s+failed/);
    const summary = summaryMatch
      ? { total: checks.length, passed: parseInt(summaryMatch[1]), warnings: parseInt(summaryMatch[2]), errors: parseInt(summaryMatch[3]) }
      : checks.length > 0
        ? { total: checks.length, passed: checks.filter(c => c.status === 'pass').length, warnings: checks.filter(c => c.status === 'warn').length, errors: checks.filter(c => c.status === 'fail').length }
        : null;

    const response = { checks, summary, raw: rawOutput };
    this._cache?.set?.(key, response, ttlMs);
    return response;
  }

  async fix() {
    const result = await this._gt.exec(['doctor', '--fix'], {
      timeoutMs: 60000,
      allowExitCodes: [0, 1],
    });
    // Clear doctor cache
    this._cache?.delete?.('doctor');
    const raw = (result.stdout || '').trim();
    return { ok: result.ok, output: raw, error: result.ok ? null : result.error };
  }
}
