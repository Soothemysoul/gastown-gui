export function registerCrewRoutes(app, { crewService } = {}) {
  if (!crewService) throw new Error('registerCrewRoutes requires crewService');

  app.get('/api/crews', async (req, res) => {
    try {
      const crews = await crewService.list({ refresh: req.query.refresh === 'true' });
      res.json(crews);
    } catch (err) {
      res.json([]);
    }
  });

  app.get('/api/crew/:name/status', async (req, res) => {
    try {
      const data = await crewService.getStatus(req.params.name);
      res.json(data);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  });

  app.post('/api/crews', async (req, res) => {
    try {
      const { name, rig } = req.body;
      const result = await crewService.add({ name, rig });
      res.status(201).json({ success: true, name: result.name, rig: result.rig, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/crew/:name', async (req, res) => {
    try {
      const result = await crewService.remove(req.params.name);
      res.json({ success: true, name: result.name, raw: result.raw });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
