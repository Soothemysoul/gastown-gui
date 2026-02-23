import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { RigService } from '../../server/services/RigService.js';

function makeGtGateway(overrides = {}) {
  return {
    exec: async () => ({ ok: true, stdout: '[]' }),
    ...overrides,
  };
}

describe('RigService', () => {
  it('lists rigs and caches results', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });
    let calls = 0;
    const gtGateway = makeGtGateway({
      exec: async () => { calls++; return { ok: true, stdout: '[{"name":"my_rig"}]' }; },
    });

    const service = new RigService({ gtGateway, cache, gtRoot: '/tmp/gt' });

    const first = await service.list({ ttlMs: 1000 });
    expect(first).toEqual([{ name: 'my_rig' }]);

    await service.list({ ttlMs: 1000 });
    expect(calls).toBe(1);

    now += 1001;
    await service.list({ ttlMs: 1000 });
    expect(calls).toBe(2);
  });

  it('sanitizes rig name on add', async () => {
    const execCalls = [];
    const gtGateway = makeGtGateway({
      exec: async (args) => { execCalls.push(args); return { ok: true, stdout: 'Added' }; },
    });

    const service = new RigService({ gtGateway, gtRoot: '/tmp/gt' });
    await service.add({ name: 'my-rig.name', url: 'https://github.com/org/repo' });

    // Should sanitize hyphens and dots to underscores
    expect(execCalls[0]).toContain('my_rig_name');
  });

  it('parks a rig and emits event', async () => {
    const events = [];
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: 'Parked' }),
    });

    const service = new RigService({
      gtGateway, gtRoot: '/tmp/gt',
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.park('my_rig');
    expect(result.ok).toBe(true);
    expect(events[0].type).toBe('rig_parked');
  });

  it('throws on add failure', async () => {
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: false, error: 'already exists' }),
    });

    const service = new RigService({ gtGateway, gtRoot: '/tmp/gt' });
    await expect(service.add({ name: 'rig', url: 'https://github.com/a/b' }))
      .rejects.toThrow('already exists');
  });
});
