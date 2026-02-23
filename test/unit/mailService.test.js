import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { MailService } from '../../server/services/MailService.js';

function makeGtGateway(overrides = {}) {
  return {
    exec: async () => ({ ok: true, stdout: '[]' }),
    ...overrides,
  };
}

describe('MailService', () => {
  it('lists mail inbox via gt and caches results', async () => {
    let now = Date.now();
    const cache = new CacheRegistry({ now: () => now });
    let calls = 0;
    const gtGateway = makeGtGateway({
      exec: async () => { calls++; return { ok: true, stdout: '[{"id":"m1"}]' }; },
    });

    const service = new MailService({ gtGateway, cache, gtRoot: '/tmp/gt' });

    const first = await service.list({ ttlMs: 1000 });
    const second = await service.list({ ttlMs: 1000 });

    expect(first).toEqual([{ id: 'm1' }]);
    expect(second).toEqual([{ id: 'm1' }]);
    expect(calls).toBe(1);

    now += 1001;
    await service.list({ ttlMs: 1000 });
    expect(calls).toBe(2);
  });

  it('sends mail via gt', async () => {
    const execCalls = [];
    const gtGateway = makeGtGateway({
      exec: async (args) => { execCalls.push(args); return { ok: true, stdout: '' }; },
    });

    const service = new MailService({ gtGateway, gtRoot: '/tmp/gt' });
    await service.send({ to: 'mayor/', subject: 'test', message: 'hello' });

    expect(execCalls[0]).toContain('mail');
    expect(execCalls[0]).toContain('send');
  });

  it('marks mail as read', async () => {
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: '' }),
    });

    const service = new MailService({ gtGateway, gtRoot: '/tmp/gt' });
    const result = await service.markRead('m1');
    expect(result.ok).toBe(true);
    expect(result.read).toBe(true);
  });

  it('throws when gt exec fails', async () => {
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: false, error: 'command failed' }),
    });

    const service = new MailService({ gtGateway, gtRoot: '/tmp/gt' });
    await expect(service.list()).rejects.toThrow('command failed');
  });
});
