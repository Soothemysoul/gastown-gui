/**
 * Gas Town GUI Bridge Server
 *
 * Node.js server that bridges the browser UI to the Gas Town CLI.
 * - Executes gt/bd commands via child_process
 * - Streams real-time events via WebSocket
 * - Serves static files
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { spawn, execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

import { createApp } from './server/app/createApp.js';
import { CommandRunner } from './server/infrastructure/CommandRunner.js';
import { CacheRegistry } from './server/infrastructure/CacheRegistry.js';
import { BDGateway } from './server/gateways/BDGateway.js';
import { GTGateway } from './server/gateways/GTGateway.js';
import { GitHubGateway } from './server/gateways/GitHubGateway.js';
import { TmuxGateway } from './server/gateways/TmuxGateway.js';
import { BeadService } from './server/services/BeadService.js';
import { ConvoyService } from './server/services/ConvoyService.js';
import { CrewService } from './server/services/CrewService.js';
import { DoctorService } from './server/services/DoctorService.js';
import { FormulaService } from './server/services/FormulaService.js';
import { GitHubService } from './server/services/GitHubService.js';
import { MailService } from './server/services/MailService.js';
import { PolecatService } from './server/services/PolecatService.js';
import { RigService } from './server/services/RigService.js';
import { StatusService } from './server/services/StatusService.js';
import { TargetService } from './server/services/TargetService.js';
import { WorkService } from './server/services/WorkService.js';
import { registerBeadRoutes } from './server/routes/beads.js';
import { registerConvoyRoutes } from './server/routes/convoys.js';
import { registerCrewRoutes } from './server/routes/crews.js';
import { registerDoctorRoutes } from './server/routes/doctor.js';
import { registerFormulaRoutes } from './server/routes/formulas.js';
import { registerGitHubRoutes } from './server/routes/github.js';
import { registerMailRoutes } from './server/routes/mail.js';
import { registerPolecatRoutes } from './server/routes/polecats.js';
import { registerRigRoutes } from './server/routes/rigs.js';
import { registerServiceRoutes } from './server/routes/services.js';
import { registerStatusRoutes } from './server/routes/status.js';
import { registerTargetRoutes } from './server/routes/targets.js';
import { registerWorkRoutes } from './server/routes/work.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.GASTOWN_PORT || 7667;
const HOST = process.env.HOST || '127.0.0.1';
const HOME = process.env.HOME || os.homedir();
const GT_ROOT = process.env.GT_ROOT || path.join(HOME, 'gt');

// ============= Infrastructure =============

const commandRunner = new CommandRunner();
const gtGateway = new GTGateway({ runner: commandRunner, gtRoot: GT_ROOT });
const bdGateway = new BDGateway({ runner: commandRunner, gtRoot: GT_ROOT });
const tmuxGateway = new TmuxGateway({ runner: commandRunner });
const gitHubGateway = new GitHubGateway({ runner: commandRunner });
const backendCache = new CacheRegistry();

// Store connected WebSocket clients
const clients = new Set();

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

const emit = (type, data) => broadcast({ type, data });

// ============= Services =============

const statusService = new StatusService({ gtGateway, tmuxGateway, cache: backendCache, gtRoot: GT_ROOT });
const targetService = new TargetService({ statusService });
const convoyService = new ConvoyService({ gtGateway, cache: backendCache, emit });
const beadService = new BeadService({ bdGateway, emit });
const workService = new WorkService({ gtGateway, bdGateway, emit });
const gitHubService = new GitHubService({ gitHubGateway, statusService, cache: backendCache });

const formulaService = new FormulaService({ gtGateway, bdGateway, cache: backendCache, emit });

const mailService = new MailService({ gtGateway, cache: backendCache, emit, gtRoot: GT_ROOT });
const polecatService = new PolecatService({ gtGateway, tmuxGateway, statusService, cache: backendCache, emit, gtRoot: GT_ROOT });
const rigService = new RigService({ gtGateway, cache: backendCache, emit, gtRoot: GT_ROOT });
const crewService = new CrewService({ gtGateway, cache: backendCache, emit });
const doctorService = new DoctorService({ gtGateway, cache: backendCache });

// ============= Express App =============

const defaultOrigins = [
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : defaultOrigins;
const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === 'true';

const app = createApp({ allowedOrigins, allowNullOrigin });
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware — serve Vue production build from dist/ if it exists, else legacy vanilla JS
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^\/(?!api|ws).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
} else {
  // Fallback to legacy vanilla JS frontend (moved to legacy/)
  const legacyDir = path.join(__dirname, 'legacy');
  app.use('/assets', express.static(path.join(__dirname, 'assets')));
  app.use('/css', express.static(path.join(legacyDir, 'css')));
  app.use('/js', express.static(path.join(legacyDir, 'js'), {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
  }));
  app.get('/', (req, res) => {
    res.sendFile(path.join(legacyDir, 'index.html'));
  });
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'assets', 'favicon.ico'));
  });
}

// ============= REST API Routes =============

registerStatusRoutes(app, { statusService });
registerConvoyRoutes(app, { convoyService });
registerWorkRoutes(app, { workService });
registerBeadRoutes(app, { beadService });
registerTargetRoutes(app, { targetService });
registerFormulaRoutes(app, { formulaService });
registerGitHubRoutes(app, { gitHubService });
registerMailRoutes(app, { mailService });
registerPolecatRoutes(app, { polecatService });
registerRigRoutes(app, { rigService, commandRunner });
registerCrewRoutes(app, { crewService });
registerDoctorRoutes(app, { doctorService });
registerServiceRoutes(app, { gtGateway, tmuxGateway, polecatService, emit });

// Get related PRs/commits for a bead (cross-cutting: beads + GitHub)
app.get('/api/bead/:beadId/links', async (req, res) => {
  const { beadId } = req.params;
  const links = { prs: [], commits: [] };

  try {
    const beadResult = await bdGateway.show(beadId);
    let beadClosedAt = null;
    if (beadResult.ok && beadResult.data) {
      const bead = Array.isArray(beadResult.data) ? beadResult.data[0] : beadResult.data;
      if (bead?.closed_at) beadClosedAt = new Date(bead.closed_at);
    }

    const rigsResult = await gtGateway.exec(['rig', 'list']);
    if (!rigsResult.ok) return res.json(links);

    const rigNames = (rigsResult.stdout || '')
      .split('\n')
      .filter(line => line.match(/^  \S/) && !line.includes(':'))
      .map(line => line.trim());

    for (const rigName of rigNames) {
      const rigPath = path.join(GT_ROOT, rigName, 'mayor', 'rig');
      try {
        const { stdout } = await execFileAsync('git', ['-C', rigPath, 'remote', 'get-url', 'origin'], { timeout: 5000 });
        const repoUrl = String(stdout || '').trim();
        const repoMatch = repoUrl.match(/github\.com[/:]([^/]+\/[^/.\s]+)/);
        if (!repoMatch) continue;
        const repo = repoMatch[1].replace(/\.git$/, '');

        try {
          const { stdout: prOutput } = await execFileAsync(
            'gh',
            ['pr', 'list', '--repo', repo, '--state', 'all', '--limit', '20', '--json', 'number,title,url,state,headRefName,body,createdAt,updatedAt'],
            { timeout: 10000 }
          );
          const prs = JSON.parse(String(prOutput || '') || '[]');
          for (const pr of prs) {
            let isRelated =
              (pr.title && pr.title.includes(beadId)) ||
              (pr.headRefName && pr.headRefName.includes(beadId)) ||
              (pr.body && pr.body.includes(beadId));
            if (!isRelated && beadClosedAt && pr.headRefName?.startsWith('polecat/')) {
              const prUpdated = new Date(pr.updatedAt || pr.createdAt);
              if (Math.abs(beadClosedAt - prUpdated) < 3600000) isRelated = true;
            }
            if (isRelated) {
              links.prs.push({ repo, number: pr.number, title: pr.title, url: pr.url, state: pr.state, branch: pr.headRefName });
            }
          }
        } catch {}
      } catch {}
    }

    res.json(links);
  } catch (err) {
    console.error('[Links] Error:', err);
    res.json(links);
  }
});

// GitLab repos (for rig picker)
app.get('/api/gitlab/repos', async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 100;

  if (req.query.refresh !== 'true') {
    const cached = backendCache.get('gitlab_repos');
    if (cached !== undefined) return res.json(cached);
  }

  try {
    const { stdout } = await execFileAsync('glab', [
      'api', `projects?membership=true&per_page=${limit}&order_by=last_activity_at`,
    ], { timeout: 15000 });

    const raw = JSON.parse(String(stdout || '') || '[]');
    const repos = raw.map(p => ({
      name: p.name,
      nameWithOwner: p.path_with_namespace,
      description: p.description || '',
      url: p.http_url_to_repo || p.ssh_url_to_repo,
      webUrl: p.web_url,
      isPrivate: p.visibility === 'private',
      pushedAt: p.last_activity_at,
      primaryLanguage: null,
    }));

    backendCache.set('gitlab_repos', repos, 5 * 60 * 1000);
    res.json(repos);
  } catch (err) {
    console.error('[GitLab] Failed to list repos:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============= WebSocket for Real-time Events =============

let activityProcess = null;

function startActivityStream() {
  if (activityProcess) return;

  console.log('[WS] Starting activity stream...');

  activityProcess = spawn('gt', ['feed', '--plain', '--follow'], {
    cwd: GT_ROOT
  });

  activityProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      const event = parseActivityLine(line);
      if (event) {
        broadcast({ type: 'activity', data: event });
      }
    });
  });

  activityProcess.stderr.on('data', (data) => {
    console.error(`[BD Activity] stderr: ${data}`);
  });

  activityProcess.on('close', (code) => {
    console.log(`[BD Activity] Process exited with code ${code}`);
    activityProcess = null;
    if (clients.size > 0) {
      setTimeout(startActivityStream, 5000);
    }
  });
}

function parseActivityLine(line) {
  const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s+(.+?)\s+(\S+)\s+(.+)$/u);
  if (!match) return null;

  const [, time, symbol, target, rest] = match;
  const [action, ...descParts] = rest.split(' · ');

  const typeMap = {
    '+': 'bead_created',
    '→': 'bead_updated',
    '✓': 'work_complete',
    '✗': 'work_failed',
    '⊘': 'bead_deleted',
    '📌': 'bead_pinned',
    '🦉': 'patrol_started',
    '⚡': 'agent_nudged',
    '🎯': 'work_slung',
    '🤝': 'handoff',
    '⚙': 'merge_started',
    '🚀': 'convoy_created',
    '📦': 'convoy_updated',
  };

  const eventType = typeMap[symbol.trim()] || 'system';

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    time,
    type: eventType,
    target,
    action: action.trim(),
    message: descParts.join(' · ').trim(),
    summary: `${action.trim()}${descParts.length ? ': ' + descParts.join(' · ').trim() : ''}`,
    timestamp: new Date().toISOString()
  };
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  clients.add(ws);

  if (clients.size === 1) {
    startActivityStream();
  }

  statusService
    .getStatus({ refresh: false })
    .then((data) => {
      if (data && ws.readyState === 1) {
        ws.send(JSON.stringify({ type: 'status', data }));
      }
    })
    .catch((err) => {
      console.error('[WS] Error getting initial status:', err.message);
    });

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clients.delete(ws);

    if (clients.size === 0 && activityProcess) {
      activityProcess.kill();
      activityProcess = null;
    }
  });

  ws.on('error', (error) => {
    console.error('[WS] Error:', error);
  });
});

// ============= Start Server =============

server.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' || HOST === '::' ? 'localhost' : HOST;
  console.log(`
╔══════════════════════════════════════════════════════════╗
║              GAS TOWN GUI SERVER                         ║
╠══════════════════════════════════════════════════════════╣
║  URL:        http://${displayHost}:${PORT}                       ║
║  GT_ROOT:    ${GT_ROOT.padEnd(40)}║
║  WebSocket:  ws://${displayHost}:${PORT}/ws                      ║
╚══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  if (activityProcess) {
    activityProcess.kill();
  }
  wss.close();
  server.close(() => {
    process.exit(0);
  });
});
