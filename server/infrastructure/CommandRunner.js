import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class CommandRunner {
  constructor({ baseEnv = process.env } = {}) {
    this._baseEnv = baseEnv;
  }

  async exec(command, args = [], options = {}) {
    const {
      cwd,
      timeoutMs = 30000,
      env = {},
      allowExitCodes = [0],
      maxBuffer = 1024 * 1024,
    } = options;

    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd,
        timeout: timeoutMs,
        env: { ...this._baseEnv, ...env },
        maxBuffer,
      });
      return {
        ok: allowExitCodes.includes(0),
        exitCode: 0,
        signal: null,
        stdout: String(stdout ?? ''),
        stderr: String(stderr ?? ''),
        error: null,
      };
    } catch (error) {
      const exitCode = typeof error.code === 'number' ? error.code : null;
      const ok = exitCode !== null && allowExitCodes.includes(exitCode);
      return {
        ok,
        exitCode,
        signal: error.signal ?? null,
        stdout: String(error.stdout ?? ''),
        stderr: String(error.stderr ?? ''),
        error: error.message,
      };
    }
  }

  spawn(command, args = [], options = {}) {
    const { cwd, env = {}, stdio } = options;
    return spawn(command, args, {
      cwd,
      env: { ...this._baseEnv, ...env },
      stdio: stdio ?? ['ignore', 'pipe', 'pipe'],
    });
  }
}

