import path from 'node:path';
import fsPromises from 'node:fs/promises';

function parseJsonOrNull(text) {
  try { return JSON.parse(text); } catch { return null; }
}

async function readRigConfig({ gtRoot, rigName }) {
  const rigConfigPath = path.join(gtRoot, rigName, 'config.json');
  const content = await fsPromises.readFile(rigConfigPath, 'utf8');
  return JSON.parse(content);
}

export class StatusService {
  constructor({
    gtGateway,
    tmuxGateway,
    cache,
    gtRoot,
    statusTtlMs = 5000,
    rigConfigTtlMs = 300000,
    missingRigConfigTtlMs = 60000,
  } = {}) {
    if (!gtGateway?.status) throw new Error('StatusService requires gtGateway.status()');
    if (!gtRoot) throw new Error('StatusService requires gtRoot');

    this._gt = gtGateway;
    this._tmux = tmuxGateway ?? null; // kept for interface compatibility, not used for running detection
    this._cache = cache ?? null;
    this._gtRoot = gtRoot;
    this._statusTtlMs = statusTtlMs;
    this._rigConfigTtlMs = rigConfigTtlMs;
    this._missingRigConfigTtlMs = missingRigConfigTtlMs;
  }

  async getStatus({ refresh = false } = {}) {
    if (!refresh && this._cache?.getOrExecute) {
      return this._cache.getOrExecute('status', () => this._fetchStatus(), this._statusTtlMs);
    }

    if (!refresh && this._cache?.get) {
      const cached = this._cache.get('status');
      if (cached !== undefined) return cached;
    }

    const status = await this._fetchStatus();
    this._cache?.set?.('status', status, this._statusTtlMs);
    return status;
  }

  async _fetchStatus() {
    // Fetch gt status and polecat list in parallel
    const [statusResult, polecatResult] = await Promise.all([
      this._gt.status({ fast: true, allowExitCodes: [0, 1] }),
      this._gt.exec(['polecat', 'list', '--all', '--json'], { timeoutMs: 10000 })
        .catch(() => ({ ok: false, stdout: '' })),
    ]);

    if (!statusResult.ok) {
      throw new Error(statusResult.error || 'Failed to get status');
    }

    const data = statusResult.data;
    if (!data) return { raw: statusResult.raw };

    const rigs = Array.isArray(data.rigs) ? data.rigs : [];

    // Build set of running agent paths.
    // gt status --json already has running: true/false for rig agents (witness, refinery).
    const runningAgentPaths = new Set();

    // From rig-level agents (witness, refinery have authoritative running field)
    for (const rig of rigs) {
      for (const agent of (rig.agents || [])) {
        if (agent.running && agent.address) {
          runningAgentPaths.add(agent.address);
        }
      }
    }

    // From polecat list
    const polecats = polecatResult.ok
      ? parseJsonOrNull((polecatResult.stdout || '').trim()) || []
      : [];
    for (const pc of polecats) {
      if (pc.session_running && pc.rig && pc.name) {
        runningAgentPaths.add(`${pc.rig}/${pc.name}`);
      }
    }

    for (const rig of rigs) {
      if (!rig?.name) continue;

      if (!rig.git_url) {
        const rigConfig = await this._getRigConfig(rig.name);
        rig.git_url = rigConfig?.git_url || null;
      }

      for (const hook of rig.hooks || []) {
        hook.running = runningAgentPaths.has(hook.agent);
      }
    }

    data.runningPolecats = Array.from(runningAgentPaths);
    return data;
  }

  async _getRigConfig(rigName) {
    const key = `rig-config:${rigName}`;

    if (this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    try {
      const config = await readRigConfig({ gtRoot: this._gtRoot, rigName });
      this._cache?.set?.(key, config, this._rigConfigTtlMs);
      return config;
    } catch {
      this._cache?.set?.(key, null, this._missingRigConfigTtlMs);
      return null;
    }
  }
}
