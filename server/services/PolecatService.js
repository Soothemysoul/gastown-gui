import path from 'node:path';
import fsPromises from 'node:fs/promises';
import os from 'node:os';

function parseJsonOrNull(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export class PolecatService {
  constructor({ gtGateway, tmuxGateway, statusService, cache, emit, gtRoot } = {}) {
    if (!gtGateway) throw new Error('PolecatService requires gtGateway');
    if (!tmuxGateway) throw new Error('PolecatService requires tmuxGateway');
    if (!gtRoot) throw new Error('PolecatService requires gtRoot');

    this._gt = gtGateway;
    this._tmux = tmuxGateway;
    this._statusService = statusService ?? null;
    this._cache = cache ?? null;
    this._emit = emit ?? null;
    this._gtRoot = gtRoot;
    this._mayorMessageHistory = [];
    this._maxMessageHistory = 100;
  }

  async listAgents({ refresh = false, ttlMs = 15000 } = {}) {
    const key = 'agents';
    if (!refresh && this._cache?.get) {
      const cached = this._cache.get(key);
      if (cached !== undefined) return cached;
    }

    const [statusResult, runningPolecats] = await Promise.all([
      this._gt.exec(['status', '--json', '--fast'], { timeoutMs: 30000 }),
      this._getRunningPolecats(),
    ]);

    if (!statusResult.ok) throw new Error(statusResult.error || 'Failed to get agents');

    const data = parseJsonOrNull((statusResult.stdout || '').trim());
    const agents = data?.agents || [];

    for (const agent of agents) {
      if (agent.running === undefined) {
        agent.running = runningPolecats.has(agent.address?.replace(/\/$/, ''));
      }
    }

    const polecats = [];
    for (const rig of data?.rigs || []) {
      for (const agent of rig.agents || []) {
        polecats.push({
          name: `${rig.name}/${agent.name}`,
          rig: rig.name,
          role: agent.role,
          running: agent.running ?? false,
          has_work: agent.has_work ?? false,
          hook_bead: null,
        });
      }
      for (const hook of rig.hooks || []) {
        if (polecats.some(p => p.name === hook.agent)) continue;
        polecats.push({
          name: hook.agent,
          rig: rig.name,
          role: hook.role,
          running: runningPolecats.has(hook.agent),
          has_work: hook.has_work,
          hook_bead: hook.hook_bead,
        });
      }
    }

    const response = { agents, polecats, runningPolecats: Array.from(runningPolecats) };
    this._cache?.set?.(key, response, ttlMs);
    return response;
  }

  async getOutput(rig, name, lines = 50) {
    const sessionName = await this._findPolecatSession(rig, name);
    if (!sessionName) return { session: `${rig}-${name}`, output: null, running: false };

    const output = await this._tmux.capturePane({ sessionName, lines });
    return { session: sessionName, output, running: output !== null };
  }

  async getTranscript(rig, name) {
    const sessionName = await this._findPolecatSession(rig, name) || `${rig}-${name}`;
    const output = await this._tmux.capturePane({ sessionName, lines: 2000 });

    let transcriptContent = null;
    const transcriptPaths = [
      path.join(this._gtRoot, rig, '.claude', 'sessions'),
      path.join(this._gtRoot, rig, '.claude', 'transcripts'),
      path.join(os.homedir(), '.claude', 'projects', rig, 'sessions'),
    ];

    for (const transcriptPath of transcriptPaths) {
      try {
        await fsPromises.access(transcriptPath);
        const dirFiles = await fsPromises.readdir(transcriptPath);
        const filtered = dirFiles.filter(f =>
          f.endsWith('.json') || f.endsWith('.md') || f.endsWith('.jsonl')
        );
        const filesWithTime = await Promise.all(
          filtered.map(async f => {
            const stat = await fsPromises.stat(path.join(transcriptPath, f));
            return { name: f, time: stat.mtime.getTime() };
          })
        );
        filesWithTime.sort((a, b) => b.time - a.time);
        if (filesWithTime.length > 0) {
          transcriptContent = await fsPromises.readFile(
            path.join(transcriptPath, filesWithTime[0].name), 'utf-8'
          );
          break;
        }
      } catch {
        // Try next path
      }
    }

    return {
      session: sessionName,
      rig,
      name,
      running: output !== null,
      output: output || '(No tmux output available)',
      transcript: transcriptContent,
      hasTranscript: !!transcriptContent,
    };
  }

  async start(rig, name) {
    const result = await this._gt.exec(
      ['sling', '--rig', rig, '--agent', name], { timeoutMs: 30000 }
    );
    if (!result.ok) throw new Error(result.error || 'Failed to start agent');
    this._emit?.('agent_started', { rig, name, agentPath: `${rig}/${name}` });
    return { ok: true, message: `Started ${rig}/${name}`, raw: (result.stdout || '').trim() };
  }

  async stop(rig, name) {
    const sessionName = await this._findPolecatSession(rig, name);
    if (!sessionName) {
      return { ok: true, message: `${rig}/${name} was not running` };
    }
    const killResult = await this._tmux.killSession(sessionName);
    if (killResult.killed || killResult.ok) {
      this._emit?.('agent_stopped', { rig, name, session: sessionName });
      return { ok: true, message: `Stopped ${rig}/${name}` };
    }
    throw new Error(`Failed to stop ${rig}/${name}`);
  }

  async restart(rig, name) {
    try {
      const sessionName = await this._findPolecatSession(rig, name);
      if (sessionName) await this._tmux.killSession(sessionName);
    } catch {
      // Ignore - session might not exist
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const result = await this._gt.exec(
      ['sling', '--rig', rig, '--agent', name], { timeoutMs: 30000 }
    );
    if (!result.ok) throw new Error(result.error || 'Failed to restart agent');
    this._emit?.('agent_restarted', { rig, name, agentPath: `${rig}/${name}` });
    return { ok: true, message: `Restarted ${rig}/${name}`, raw: (result.stdout || '').trim() };
  }

  async getHookStatus() {
    const result = await this._gt.exec(['hook', 'status', '--json'], { timeoutMs: 30000 });
    if (result.ok) {
      return parseJsonOrNull((result.stdout || '').trim()) || { hooked: null };
    }
    return { hooked: null, reason: 'not_in_agent_context' };
  }

  async nudge({ target, message, autoStart = true } = {}) {
    if (!message) throw new Error('Message is required');

    const nudgeTarget = target || 'mayor';
    const sessionName = `gt-${nudgeTarget}`;

    const isRunning = await this._isSessionRunning(sessionName);
    let wasAutoStarted = false;

    if (!isRunning) {
      if (nudgeTarget === 'mayor' && autoStart) {
        const startResult = await this._gt.exec(['mayor', 'start'], { timeoutMs: 30000 });
        if (!startResult.ok) {
          this._addMayorMessage(nudgeTarget, message, 'failed', 'Failed to auto-start Mayor');
          throw new Error('Mayor not running and failed to auto-start');
        }
        wasAutoStarted = true;
        await new Promise(resolve => setTimeout(resolve, 2000));
        this._emit?.('service_started', { service: 'mayor', autoStarted: true });
      } else {
        this._addMayorMessage(nudgeTarget, message, 'failed', `Session ${sessionName} not running`);
        const err = new Error(`${nudgeTarget} is not running`);
        err.statusCode = 400;
        throw err;
      }
    }

    const result = await this._gt.exec(['nudge', nudgeTarget, message], { timeoutMs: 10000 });
    if (result.ok) {
      const status = wasAutoStarted ? 'auto-started' : 'sent';
      const entry = this._addMayorMessage(nudgeTarget, message, status);
      return { ok: true, target: nudgeTarget, message, wasAutoStarted, messageId: entry.id };
    }
    this._addMayorMessage(nudgeTarget, message, 'failed', result.error);
    throw new Error(result.error || 'Failed to send message');
  }

  getMayorMessages(limit = 50) {
    const safeLimit = Math.min(limit, this._maxMessageHistory);
    return this._mayorMessageHistory.slice(0, safeLimit);
  }

  async getMayorOutput(lines = 100) {
    const sessionName = await this.findAgentSession('mayor');
    const output = sessionName ? await this._tmux.capturePane({ sessionName, lines }) : null;
    return {
      session: sessionName || 'hq-mayor',
      output,
      running: !!sessionName && output !== null,
      recentMessages: this._mayorMessageHistory.slice(0, 10),
    };
  }

  _addMayorMessage(target, message, status, response = null) {
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      target, message, status, response,
    };
    this._mayorMessageHistory.unshift(entry);
    if (this._mayorMessageHistory.length > this._maxMessageHistory) {
      this._mayorMessageHistory.pop();
    }
    this._emit?.('mayor_message', entry);
    return entry;
  }

  async _getRunningPolecats() {
    try {
      const result = await this._gt.exec(
        ['polecat', 'list', '--all', '--json'], { timeoutMs: 10000 }
      );
      const polecats = parseJsonOrNull((result.stdout || '').trim()) || [];
      const paths = new Set();
      for (const pc of (Array.isArray(polecats) ? polecats : [])) {
        if (pc.session_running && pc.rig && pc.name) {
          paths.add(`${pc.rig}/${pc.name}`);
        }
      }
      return paths;
    } catch {
      return new Set();
    }
  }

  async _isSessionRunning(sessionName) {
    const hasIt = await this._tmux.hasSession(sessionName);
    if (hasIt) return true;
    // Fallback: match any session ending with the agent name
    const agentName = sessionName.replace(/^[^-]+-/, '');
    const listing = await this._tmux.listSessions();
    return listing.split('\n').some(line =>
      line.match(new RegExp(`^[^:]*-${agentName}:`))
    );
  }

  async findAgentSession(name) {
    try {
      const result = await this._gt.exec(['status', '--json', '--fast'], { timeoutMs: 10000 });
      const data = parseJsonOrNull((result.stdout || '').trim()) || {};
      for (const agent of (data.agents || [])) {
        if (agent.name === name && agent.session) return agent.session;
      }
      for (const rig of (data.rigs || [])) {
        for (const agent of (rig.agents || [])) {
          if (agent.name === name && agent.session) return agent.session;
        }
      }
    } catch {}
    // Fallback
    const listing = await this._tmux.listSessions();
    const line = listing.split('\n').find(l => l.match(new RegExp(`^[^:]*-${name}:`)));
    if (line) return line.split(':')[0].trim();
    return null;
  }

  async _findPolecatSession(rig, name) {
    try {
      const result = await this._gt.exec(['status', '--json', '--fast'], { timeoutMs: 10000 });
      const data = parseJsonOrNull((result.stdout || '').trim()) || {};
      for (const r of (data.rigs || [])) {
        if (r.name !== rig) continue;
        for (const agent of (r.agents || [])) {
          if (agent.session) {
            const m = agent.session.match(/^(.+)-[^-]+$/);
            if (m) return `${m[1]}-${name}`;
          }
        }
      }
    } catch {}
    const listing = await this._tmux.listSessions();
    const line = listing.split('\n').find(l => l.match(new RegExp(`^[^:]*-${name}:`)));
    if (line) return line.split(':')[0].trim();
    return null;
  }
}
