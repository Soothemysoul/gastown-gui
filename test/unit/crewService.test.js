import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { CrewService } from '../../server/services/CrewService.js';

function makeGtGateway(overrides = {}) {
  return {
    exec: async () => ({ ok: true, stdout: '[]' }),
    ...overrides,
  };
}

describe('CrewService', () => {
  it('lists crews and caches results', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });
    let calls = 0;
    const gtGateway = makeGtGateway({
      exec: async () => { calls++; return { ok: true, stdout: '[{"name":"crew1"}]' }; },
    });

    const service = new CrewService({ gtGateway, cache });

    const first = await service.list({ ttlMs: 1000 });
    expect(first).toEqual([{ name: 'crew1' }]);
    expect(calls).toBe(1);

    const second = await service.list({ ttlMs: 1000 });
    expect(second).toEqual([{ name: 'crew1' }]);
    expect(calls).toBe(1);
  });

  it('adds a crew and emits event', async () => {
    const events = [];
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: 'Added crew1' }),
    });

    const service = new CrewService({
      gtGateway,
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.add({ name: 'crew1', rig: 'my_rig' });
    expect(result.ok).toBe(true);
    expect(events).toEqual([{ type: 'crew_added', data: { name: 'crew1', rig: 'my_rig' } }]);
  });

  it('throws when crew name is missing', async () => {
    const service = new CrewService({ gtGateway: makeGtGateway() });
    await expect(service.add({})).rejects.toThrow('Crew name is required');
  });

  it('removes a crew and emits event', async () => {
    const events = [];
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: 'Removed' }),
    });

    const service = new CrewService({
      gtGateway,
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.remove('crew1');
    expect(result.ok).toBe(true);
    expect(events[0].type).toBe('crew_removed');
  });
});
