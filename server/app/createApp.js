import express from 'express';
import cors from 'cors';

export function createApp({ allowedOrigins, allowNullOrigin = false } = {}) {
  const app = express();

  app.disable('x-powered-by');

  const origins = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  const allowAllOrigins = origins.includes('*');

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowAllOrigins) return callback(null, true);
      if (origin === 'null') return callback(allowNullOrigin ? null : new Error('CORS origin not allowed'), allowNullOrigin);
      if (origins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS origin not allowed'));
    },
  }));

  app.use(express.json({ limit: '1mb' }));

  return app;
}

