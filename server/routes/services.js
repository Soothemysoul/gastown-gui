export function registerServiceRoutes(app, { gtGateway, tmuxGateway, polecatService, emit } = {}) {
  if (!gtGateway) throw new Error('registerServiceRoutes requires gtGateway');

  const validServices = ['mayor', 'witness', 'refinery', 'deacon'];
  const needsRig = name => ['witness', 'refinery'].includes(name.toLowerCase());

  app.post('/api/service/:name/up', async (req, res) => {
    const { name } = req.params;
    if (!validServices.includes(name.toLowerCase())) {
      return res.status(400).json({ error: `Invalid service: ${name}. Valid services: ${validServices.join(', ')}` });
    }
    const { rig } = req.body || {};
    if (needsRig(name) && !rig) {
      return res.status(400).json({ error: `${name} requires a rig parameter` });
    }

    try {
      const args = [name, 'start'];
      if (rig) args.push(rig);
      const result = await gtGateway.exec(args, { timeoutMs: 30000 });
      if (result.ok) {
        emit?.('service_started', { service: name });
        res.json({ success: true, service: name, message: `${name} started`, raw: (result.stdout || '').trim() });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/service/:name/down', async (req, res) => {
    const { name } = req.params;
    const { rig } = req.body || {};
    if (!validServices.includes(name.toLowerCase())) {
      return res.status(400).json({ error: `Invalid service: ${name}. Valid services: ${validServices.join(', ')}` });
    }
    if (needsRig(name) && !rig) {
      return res.status(400).json({ error: `${name} requires a rig parameter` });
    }

    try {
      const args = [name, 'stop'];
      if (rig) args.push(rig);
      const result = await gtGateway.exec(args, { timeoutMs: 10000 });
      if (result.ok) {
        emit?.('service_stopped', { service: name });
        res.json({ success: true, service: name, message: `${name} stopped`, raw: (result.stdout || '').trim() });
      } else {
        // Fallback: try killing tmux session directly
        if (polecatService && tmuxGateway) {
          try {
            const sessionName = await polecatService.findAgentSession(name);
            if (sessionName) {
              await tmuxGateway.killSession(sessionName);
              emit?.('service_stopped', { service: name });
              return res.json({ success: true, service: name, message: `${name} stopped via tmux` });
            }
          } catch {}
        }
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/service/:name/restart', async (req, res) => {
    const { name } = req.params;
    const { rig } = req.body || {};
    if (!validServices.includes(name.toLowerCase())) {
      return res.status(400).json({ error: `Invalid service: ${name}. Valid services: ${validServices.join(', ')}` });
    }
    if (needsRig(name) && !rig) {
      return res.status(400).json({ error: `${name} requires a rig parameter` });
    }

    try {
      try {
        const stopArgs = [name, 'stop'];
        if (rig) stopArgs.push(rig);
        await gtGateway.exec(stopArgs, { timeoutMs: 10000 });
      } catch {}

      await new Promise(resolve => setTimeout(resolve, 1000));

      const startArgs = [name, 'start'];
      if (rig) startArgs.push(rig);
      const result = await gtGateway.exec(startArgs, { timeoutMs: 30000 });
      if (result.ok) {
        emit?.('service_restarted', { service: name });
        res.json({ success: true, service: name, message: `${name} restarted`, raw: (result.stdout || '').trim() });
      } else {
        res.status(500).json({ success: false, error: result.error });
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/service/:name/status', async (req, res) => {
    const { name } = req.params;
    try {
      if (polecatService) {
        const sessionName = await polecatService.findAgentSession(name);
        const running = !!sessionName;
        return res.json({ service: name, running, session: sessionName || null });
      }
      res.json({ service: name, running: false, session: null });
    } catch (err) {
      res.json({ service: name, running: false, error: err.message });
    }
  });
}
