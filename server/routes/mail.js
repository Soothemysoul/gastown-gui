export function registerMailRoutes(app, { mailService } = {}) {
  if (!mailService) throw new Error('registerMailRoutes requires mailService');

  app.get('/api/mail', async (req, res) => {
    try {
      const data = await mailService.list({ refresh: req.query.refresh === 'true' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mail', async (req, res) => {
    try {
      const { to, subject, message, priority } = req.body;
      await mailService.send({ to, subject, message, priority });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/mail/all', async (req, res) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const result = await mailService.getAll({ page, limit });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Failed to read mail feed' });
    }
  });

  app.get('/api/mail/:id', async (req, res) => {
    try {
      const mail = await mailService.get(req.params.id);
      res.json(mail);
    } catch (err) {
      res.status(404).json({ error: 'Mail not found' });
    }
  });

  app.post('/api/mail/:id/read', async (req, res) => {
    try {
      const result = await mailService.markRead(req.params.id);
      res.json({ success: true, id: result.id, read: result.read });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/mail/:id/unread', async (req, res) => {
    try {
      const result = await mailService.markUnread(req.params.id);
      res.json({ success: true, id: result.id, read: result.read });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
