export function registerTargetRoutes(app, { targetService } = {}) {
  if (!targetService) throw new Error('registerTargetRoutes requires targetService');

  app.get('/api/targets', async (req, res) => {
    try {
      const targets = await targetService.list({ refresh: req.query.refresh === 'true' });
      res.json(targets);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

