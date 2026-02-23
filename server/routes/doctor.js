export function registerDoctorRoutes(app, { doctorService } = {}) {
  if (!doctorService) throw new Error('registerDoctorRoutes requires doctorService');

  app.get('/api/doctor', async (req, res) => {
    try {
      const data = await doctorService.check({ refresh: req.query.refresh === 'true' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/doctor/fix', async (req, res) => {
    try {
      const result = await doctorService.fix();
      if (result.ok) {
        res.json({ success: true, output: result.output });
      } else {
        res.json({ success: false, error: result.error, output: result.output || '' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
