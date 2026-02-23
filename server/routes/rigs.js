export function registerRigRoutes(app, { rigService, commandRunner } = {}) {
  if (!rigService) throw new Error('registerRigRoutes requires rigService');

  app.get('/api/rigs', async (req, res) => {
    try {
      const rigs = await rigService.list({ refresh: req.query.refresh === 'true' });
      res.json(rigs);
    } catch (err) {
      res.json([]);
    }
  });

  app.post('/api/rigs', async (req, res) => {
    try {
      const { name, url } = req.body;
      const result = await rigService.add({ name, url });
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/rigs/:name', async (req, res) => {
    try {
      const result = await rigService.remove(req.params.name);
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/rigs/:name/park', async (req, res) => {
    try {
      const result = await rigService.park(req.params.name);
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/rigs/:name/unpark', async (req, res) => {
    try {
      const result = await rigService.unpark(req.params.name);
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/rigs/:name/boot', async (req, res) => {
    try {
      const result = await rigService.boot(req.params.name);
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/setup/status', async (req, res) => {
    try {
      const status = await rigService.getSetupStatusFull({ bdRunner: commandRunner });
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
