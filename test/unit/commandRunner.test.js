import { describe, it, expect } from 'vitest';

import { CommandRunner } from '../../server/infrastructure/CommandRunner.js';

describe('CommandRunner', () => {
  it('exec returns ok=true for exit code 0', async () => {
    const runner = new CommandRunner();
    const result = await runner.exec(process.execPath, ['-e', "console.log('hi')"]);
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hi');
  });

  it('exec returns ok=false for non-allowed exit codes', async () => {
    const runner = new CommandRunner();
    const result = await runner.exec(process.execPath, ['-e', 'process.exit(1)']);
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBe(1);
  });

  it('exec returns ok=true for allowed non-zero exit codes', async () => {
    const runner = new CommandRunner();
    const result = await runner.exec(process.execPath, ['-e', 'process.exit(1)'], {
      allowExitCodes: [0, 1],
    });
    expect(result.ok).toBe(true);
    expect(result.exitCode).toBe(1);
  });

  it('exec returns ok=false when command is missing', async () => {
    const runner = new CommandRunner();
    const result = await runner.exec('__definitely_not_a_real_command__', []);
    expect(result.ok).toBe(false);
    expect(result.exitCode).toBeNull();
    expect(typeof result.error).toBe('string');
  });

  it('exec returns ok=false when the command times out', async () => {
    const runner = new CommandRunner();
    const result = await runner.exec(process.execPath, ['-e', 'setTimeout(() => {}, 10000)'], {
      timeoutMs: 10,
    });
    expect(result.ok).toBe(false);
    expect(result.exitCode === null || typeof result.exitCode === 'number').toBe(true);
    expect(typeof result.error).toBe('string');
  });
});

