import { describe, it, expect } from 'vitest';

import { AgentPath } from '../../server/domain/values/AgentPath.js';

describe('AgentPath', () => {
  it('formats toString and toSessionName', () => {
    const agent = new AgentPath('rig', 'name');
    expect(agent.toString()).toBe('rig/name');
    expect(agent.toSessionName()).toBe('gt-rig-name');
  });

  it('fromString parses rig/name', () => {
    const agent = AgentPath.fromString('r/n');
    expect(agent.toString()).toBe('r/n');
  });

  it('fromString rejects invalid formats', () => {
    expect(() => AgentPath.fromString('r')).toThrow(/invalid/i);
    expect(() => AgentPath.fromString('r/n/extra')).toThrow(/invalid/i);
  });
});

