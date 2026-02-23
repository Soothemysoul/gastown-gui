import { AgentPath } from '../domain/values/AgentPath.js';

function requireAgentPath(req, res) {
  try {
    return new AgentPath(req.params.rig, req.params.name);
  } catch {
    res.status(400).json({ error: 'Invalid rig or agent name' });
    return null;
  }
}

export function registerPolecatRoutes(app, { polecatService } = {}) {
  if (!polecatService) throw new Error('registerPolecatRoutes requires polecatService');

  app.get('/api/agents', async (req, res) => {
    try {
      const data = await polecatService.listAgents({
        refresh: req.query.refresh === 'true',
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/polecat/:rig/:name/output', async (req, res) => {
    const agent = requireAgentPath(req, res);
    if (!agent) return;
    try {
      const lines = parseInt(req.query.lines) || 50;
      const data = await polecatService.getOutput(agent.rig.value, agent.name.value, lines);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/polecat/:rig/:name/transcript', async (req, res) => {
    const agent = requireAgentPath(req, res);
    if (!agent) return;
    try {
      const data = await polecatService.getTranscript(agent.rig.value, agent.name.value);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/polecat/:rig/:name/start', async (req, res) => {
    const agent = requireAgentPath(req, res);
    if (!agent) return;
    try {
      const result = await polecatService.start(agent.rig.value, agent.name.value);
      res.json({ success: true, message: result.message, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/polecat/:rig/:name/stop', async (req, res) => {
    const agent = requireAgentPath(req, res);
    if (!agent) return;
    try {
      const result = await polecatService.stop(agent.rig.value, agent.name.value);
      res.json({ success: true, message: result.message });
    } catch (err) {
      const errText = err.message || '';
      if (errText.includes("can't find session")) {
        res.json({ success: true, message: `${agent.rig.value}/${agent.name.value} was not running` });
      } else {
        res.status(500).json({ success: false, error: err.message });
      }
    }
  });

  app.post('/api/polecat/:rig/:name/restart', async (req, res) => {
    const agent = requireAgentPath(req, res);
    if (!agent) return;
    try {
      const result = await polecatService.restart(agent.rig.value, agent.name.value);
      res.json({ success: true, message: result.message, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/hook', async (req, res) => {
    try {
      const data = await polecatService.getHookStatus();
      res.json(data);
    } catch (err) {
      res.json({ hooked: null, reason: 'not_in_agent_context' });
    }
  });

  app.post('/api/nudge', async (req, res) => {
    try {
      const { target, message, autoStart } = req.body;
      const result = await polecatService.nudge({ target, message, autoStart });
      res.json({ success: true, ...result });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      res.status(statusCode).json({ error: err.message });
    }
  });

  app.get('/api/mayor/messages', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json(polecatService.getMayorMessages(limit));
  });

  app.get('/api/mayor/output', async (req, res) => {
    try {
      const lines = parseInt(req.query.lines) || 100;
      const data = await polecatService.getMayorOutput(lines);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
