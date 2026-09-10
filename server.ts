import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { db } from './server/db';

async function startServer() {
  await db.initialize();
  const app = express();
  const PORT = 3000;

  // Body parsing for JSON and raw text/CSV
  app.use(express.json({ limit: '20mb' }));
  app.use(express.text({ limit: '20mb', type: ['text/csv', 'text/plain'] }));

  // CORS / Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'SAT-SA Supervisory Analytics',
      sih: 'SIH26157',
      timestamp: new Date().toISOString()
    });
  });

  // Mount primary SAT-SA API routes
  app.use('/api', apiRouter);

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SAT-SA] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('[SAT-SA] Failed to start server:', err);
  process.exit(1);
});
