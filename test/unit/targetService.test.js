import { describe, it, expect } from 'vitest';

import { TargetService } from '../../server/services/TargetService.js';

describe('TargetService', () => {
  it('returns global, rig, and running agent targets', async () => {
    const statusService = {
      getStatus: async () => ({
        rigs: [
          {
            name: 'work1',
            agents: [
              { name: 'Toast', role: 'polecat', running: true, has_work: false },
              { name: 'Witness', role: 'witness', running: true, has_work: true },
              { name: 'Stopped', role: 'refinery', running: false, has_work: false },
            ],
          },
        ],
      }),
    };

    const service = new TargetService({ statusService });
    const targets = await service.list();

    expect(targets).toEqual([
      expect.objectContaining({ id: 'mayor', type: 'global' }),
      expect.objectContaining({ id: 'deacon', type: 'global' }),
      expect.objectContaining({ id: 'deacon/dogs', type: 'global' }),
      expect.objectContaining({ id: 'work1', type: 'rig' }),
      expect.objectContaining({ id: 'work1/Toast', type: 'agent', icon: 'engineering' }),
      expect.objectContaining({ id: 'work1/Witness', type: 'agent', icon: 'visibility' }),
    ]);

    expect(targets.find(t => t.id === 'work1/Stopped')).toBeUndefined();
  });

  it('returns global targets even when status fails', async () => {
    const statusService = { getStatus: async () => { throw new Error('boom'); } };
    const service = new TargetService({ statusService });

    const targets = await service.list();
    expect(targets.map(t => t.id)).toEqual(['mayor', 'deacon', 'deacon/dogs']);
  });
});

