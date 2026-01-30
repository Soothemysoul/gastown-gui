export function registerStatusRoutes(app, { statusService } = {}) {
  if (!statusService) throw new Error('registerStatusRoutes requires statusService');

  app.get('/api/status', async (req, res) => {
    try {
      const status = await statusService.getStatus({ refresh: req.query.refresh === 'true' });
      res.json(status);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

