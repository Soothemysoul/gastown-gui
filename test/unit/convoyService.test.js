import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { ConvoyService } from '../../server/services/ConvoyService.js';

describe('ConvoyService', () => {
  it('lists convoys via gt and caches by query', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });

    const gtGateway = {
      listCalls: 0,
      listConvoys: async () => {
        gtGateway.listCalls++;
        return { ok: true, data: [{ id: 'convoy-1' }] };
      },
      convoyStatus: async () => ({ ok: true, data: {} }),
      createConvoy: async () => ({ ok: true, raw: '', convoyId: 'convoy-1' }),
    };

    const service = new ConvoyService({ gtGateway, cache });

    const first = await service.list({ all: true, status: 'running', ttlMs: 1000 });
    const second = await service.list({ all: true, status: 'running', ttlMs: 1000 });

    expect(first).toEqual([{ id: 'convoy-1' }]);
    expect(second).toEqual([{ id: 'convoy-1' }]);
    expect(gtGateway.listCalls).toBe(1);

    now += 1001;
    await service.list({ all: true, status: 'running', ttlMs: 1000 });
    expect(gtGateway.listCalls).toBe(2);
  });

  it('creates a convoy and emits convoy_created', async () => {
    const events = [];
    const gtGateway = {
      listConvoys: async () => ({ ok: true, data: [] }),
      convoyStatus: async () => ({ ok: true, data: {} }),
      createConvoy: async () => ({ ok: true, raw: 'Created convoy: convoy-abc', convoyId: 'convoy-abc' }),
    };

    const service = new ConvoyService({
      gtGateway,
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.create({ name: 'Test', issues: ['bd-1'], notify: 'mayor' });
    expect(result.ok).toBe(true);
    expect(result.convoyId).toBe('convoy-abc');
    expect(events).toEqual([{ type: 'convoy_created', data: { convoy_id: 'convoy-abc', name: 'Test' } }]);
  });
});

