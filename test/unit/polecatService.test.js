import { describe, it, expect } from 'vitest';

import { CacheRegistry } from '../../server/infrastructure/CacheRegistry.js';
import { PolecatService } from '../../server/services/PolecatService.js';

function makeGtGateway(overrides = {}) {
  return {
    exec: async () => ({ ok: true, stdout: '{}' }),
    ...overrides,
  };
}

function makeTmuxGateway(overrides = {}) {
  return {
    hasSession: async () => false,
    listSessions: async () => '',
    capturePane: async () => null,
    killSession: async () => ({ ok: true, killed: true }),
    ...overrides,
  };
}

describe('PolecatService', () => {
  it('lists agents with running status', async () => {
    const statusJson = JSON.stringify({
      agents: [{ name: 'mayor', running: true, address: 'mayor/' }],
      rigs: [{
        name: 'my_rig',
        agents: [{ name: 'witness', role: 'witness', running: true }],
        hooks: [{ agent: 'my_rig/alice', role: 'polecat', has_work: true, hook_bead: 'b1' }],
      }],
    });

    const polecatJson = JSON.stringify([
      { session_running: true, rig: 'my_rig', name: 'alice' },
    ]);

    let callIdx = 0;
    const gtGateway = makeGtGateway({
      exec: async (args) => {
        if (args.includes('polecat')) return { ok: true, stdout: polecatJson };
        return { ok: true, stdout: statusJson };
      },
    });

    const service = new PolecatService({
      gtGateway,
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
    });

    const result = await service.listAgents();
    expect(result.agents).toHaveLength(1);
    expect(result.polecats).toHaveLength(2); // witness + alice hook
    expect(result.runningPolecats).toContain('my_rig/alice');
  });

  it('starts an agent via gt sling', async () => {
    const execCalls = [];
    const events = [];
    const gtGateway = makeGtGateway({
      exec: async (args) => { execCalls.push(args); return { ok: true, stdout: 'Started' }; },
    });

    const service = new PolecatService({
      gtGateway,
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.start('my_rig', 'alice');
    expect(result.ok).toBe(true);
    expect(execCalls[0]).toContain('sling');
    expect(events[0].type).toBe('agent_started');
  });

  it('stops an agent by killing tmux session', async () => {
    const events = [];
    const gtGateway = makeGtGateway({
      exec: async () => ({
        ok: true,
        stdout: JSON.stringify({
          rigs: [{ name: 'rig', agents: [{ name: 'witness', session: 'tw-witness' }] }],
        }),
      }),
    });

    const service = new PolecatService({
      gtGateway,
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
      emit: (type, data) => events.push({ type, data }),
    });

    const result = await service.stop('rig', 'alice');
    expect(result.ok).toBe(true);
  });

  it('returns hook status', async () => {
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: true, stdout: '{"hooked":"bead-1"}' }),
    });

    const service = new PolecatService({
      gtGateway,
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
    });

    const result = await service.getHookStatus();
    expect(result.hooked).toBe('bead-1');
  });

  it('returns graceful fallback when hook fails', async () => {
    const gtGateway = makeGtGateway({
      exec: async () => ({ ok: false, error: 'not in agent context' }),
    });

    const service = new PolecatService({
      gtGateway,
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
    });

    const result = await service.getHookStatus();
    expect(result.hooked).toBeNull();
    expect(result.reason).toBe('not_in_agent_context');
  });

  it('tracks mayor message history', () => {
    const service = new PolecatService({
      gtGateway: makeGtGateway(),
      tmuxGateway: makeTmuxGateway(),
      gtRoot: '/tmp/gt',
    });

    service._addMayorMessage('mayor', 'hello', 'sent');
    service._addMayorMessage('mayor', 'world', 'sent');

    const messages = service.getMayorMessages(10);
    expect(messages).toHaveLength(2);
    expect(messages[0].message).toBe('world'); // newest first
  });
});
