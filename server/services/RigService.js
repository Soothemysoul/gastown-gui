import os from 'node:os';
import path from 'node:path';
import fsPromises from 'node:fs/promises';

function parseJsonOrNull(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export class RigService {
  constructor({ gtGateway, cache, emit, gtRoot } = {}) {
    if (!gtGateway) throw new Error('RigService requires gtGateway');
    if (!gtRoot) throw new Error('RigService requires gtRoot');

    this._gt = gtGateway;
    this._cache = cache ?? null;
    this._emit = emit ?? null;
    this._gtRoot = gtRoot;
  }

  async list({ refresh = false, ttlMs = 30000 } = {}) {
    const key = 'rigs';
    if (!refresh && this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    const result = await this._gt.exec(['rig', 'list', '--json'], { timeoutMs: 30000 });
    const rigs = result.ok ? (parseJsonOrNull((result.stdout || '').trim()) || []) : [];
    this._cache?.set?.(key, rigs, ttlMs);
    return rigs;
  }

  async add({ name, url } = {}) {
    if (!name || !url) throw new Error('Name and URL are required');

    // Sanitize name: gt rig add forbids hyphens, dots, spaces
    let sanitizedName = name.replace(/[-.\s]+/g, '_');

    const isLocalPath = /^[./~]/.test(url) || (!url.includes('://') && !url.startsWith('git@'));

    let result;
    if (isLocalPath) {
      const localPath = url.startsWith('~') ? os.homedir() + url.slice(1) : url;
      result = await this._gt.exec(['rig', 'add', sanitizedName, '--adopt'], {
        timeoutMs: 120000,
        cwd: localPath,
      });
    } else {
      result = await this._gt.exec(['rig', 'add', sanitizedName, url], { timeoutMs: 120000 });
    }

    const raw = (result.stdout || '').trim();
    const hasError = raw.includes('Error:') || raw.includes('error:');

    if (result.ok && !hasError) {
      this._emit?.('rig_added', { name: sanitizedName, url });
      return { ok: true, name: sanitizedName, raw };
    }
    throw new Error(hasError ? raw : (result.error || 'Failed to add rig'));
  }

  async remove(name) {
    if (!name) throw new Error('Rig name is required');
    const result = await this._gt.exec(['rig', 'remove', name], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to remove rig');
    this._emit?.('rig_removed', { name });
    return { ok: true, name, raw: (result.stdout || '').trim() };
  }

  async park(name) {
    const result = await this._gt.exec(['rig', 'park', name], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to park rig');
    this._emit?.('rig_parked', { name });
    return { ok: true, name, raw: (result.stdout || '').trim() };
  }

  async unpark(name) {
    const result = await this._gt.exec(['rig', 'unpark', name], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to unpark rig');
    this._emit?.('rig_unparked', { name });
    return { ok: true, name, raw: (result.stdout || '').trim() };
  }

  async boot(name) {
    const result = await this._gt.exec(['rig', 'boot', name], { timeoutMs: 60000 });
    if (!result.ok) throw new Error(result.error || 'Failed to boot rig');
    this._emit?.('rig_booted', { name });
    return { ok: true, name, raw: (result.stdout || '').trim() };
  }

  async getSetupStatus() {
    const status = {
      gt_installed: false, gt_version: null,
      bd_installed: false, bd_version: null,
      workspace_initialized: false, workspace_path: this._gtRoot,
      rigs: [],
    };

    // Check gt
    try {
      const r = await this._gt.exec(['version'], { timeoutMs: 5000 });
      if (r.ok) {
        status.gt_installed = true;
        status.gt_version = (r.stdout || '').trim().split('\n')[0];
      }
    } catch {}

    // Check bd — use runner directly since BDGateway isn't available here
    try {
      const r = await this._gt.exec(['--version'], { timeoutMs: 5000 });
      // gt --version works; bd is separate. We'll just report gt status.
    } catch {}

    // Check workspace
    try {
      await fsPromises.access(path.join(this._gtRoot, 'mayor'));
      status.workspace_initialized = true;
    } catch {}

    // Get rigs
    try {
      const rigs = await this.list({ refresh: false });
      status.rigs = rigs.map(r => ({ name: r.name, status: r.status }));
    } catch {}

    return status;
  }

  async getSetupStatusFull({ bdRunner } = {}) {
    const status = await this.getSetupStatus();

    // Check bd separately if runner provided
    if (bdRunner) {
      try {
        const r = await bdRunner.exec('bd', ['version'], { timeoutMs: 5000 });
        if (r.ok) {
          status.bd_installed = true;
          status.bd_version = (r.stdout || '').trim().split('\n')[0];
        }
      } catch {}
    }

    return status;
  }
}
