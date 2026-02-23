import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { DoctorService } from '../../server/services/DoctorService.js';

function makeGtGateway(overrides = {}) {
  return {
    exec: async () => ({ ok: true, stdout: '' }),
    ...overrides,
  };
}

describe('DoctorService', () => {
  it('parses doctor check output', async () => {
    const rawOutput = '  ○  check1  ✓  check1  All good\n  ○  check2  ✗  check2  Something wrong\n✓ 1 passed  ⚠ 0 warnings  ✖ 1 failed';
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: rawOutput }),
    });

    const service = new DoctorService({ gtGateway });
    const result = await service.check();

    expect(result.checks.length).toBe(2);
    expect(result.checks[0].status).toBe('pass');
    expect(result.checks[1].status).toBe('fail');
    expect(result.summary.passed).toBe(1);
    expect(result.summary.errors).toBe(1);
  });

  it('caches doctor results', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });
    let calls = 0;
    const gtGateway = makeGtGateway({
      exec: async () => { calls++; return { ok: true, stdout: '' }; },
    });

    const service = new DoctorService({ gtGateway, cache });
    await service.check({ ttlMs: 1000 });
    await service.check({ ttlMs: 1000 });
    expect(calls).toBe(1);
  });

  it('fix clears doctor cache', async () => {
    const cache = new CacheRegistry();
    cache.set('doctor', { checks: [] }, 60000);

    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: 'Fixed' }),
    });

    const service = new DoctorService({ gtGateway, cache });
    await service.fix();

    expect(cache.get('doctor')).toBeUndefined();
  });
});
