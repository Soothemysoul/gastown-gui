function parseJsonOrNull(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export class CrewService {
  constructor({ gtGateway, cache, emit } = {}) {
    if (!gtGateway) throw new Error('CrewService requires gtGateway');

    this._gt = gtGateway;
    this._cache = cache ?? null;
    this._emit = emit ?? null;
  }

  async list({ refresh = false, ttlMs = 5000 } = {}) {
    const key = 'crews';
    if (!refresh && this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    const result = await this._gt.exec(
      ['crew', 'list', '--all', '--json'], { timeoutMs: 30000 }
    );

    if (result.ok) {
      const data = parseJsonOrNull((result.stdout || '').trim());
      const crews = Array.isArray(data) ? data : [];
      this._cache?.set?.(key, crews, ttlMs);
      return crews;
    }
    return [];
  }

  async getStatus(name) {
    const result = await this._gt.exec(
      ['crew', 'status', name, '--json'], { timeoutMs: 30000 }
    );
    if (!result.ok) throw new Error(result.error || 'Crew not found');
    const data = parseJsonOrNull((result.stdout || '').trim());
    return data || { name, raw: (result.stdout || '').trim() };
  }

  async add({ name, rig } = {}) {
    if (!name) throw new Error('Crew name is required');
    const args = ['crew', 'add', name];
    if (rig) args.push('--rig', rig);

    const result = await this._gt.exec(args, { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to add crew');
    this._emit?.('crew_added', { name, rig });
    return { ok: true, name, rig, raw: (result.stdout || '').trim() };
  }

  async remove(name) {
    if (!name) throw new Error('Crew name is required');
    const result = await this._gt.exec(['crew', 'remove', name], { timeoutMs: 30000 });
    if (!result.ok) throw new Error(result.error || 'Failed to remove crew');
    this._emit?.('crew_removed', { name });
    return { ok: true, name, raw: (result.stdout || '').trim() };
  }
}
