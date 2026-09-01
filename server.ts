import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { authRoutes } from './backend/routes/authRoutes';
import { publicRoutes } from './backend/routes/publicRoutes';
import { reportRoutes } from './backend/routes/reportRoutes';
import { adminRoutes } from './backend/routes/adminRoutes';
import { globalErrorHandler } from './backend/middleware/errorHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  if (allowedOrigin) {
    app.use(
      cors({
        origin: allowedOrigin,
        credentials: true,
      })
    );
  } else {
    // Development / same-origin handling
    app.use(
      cors({
        origin: true,
        credentials: true,
      })
    );
  }

  app.use(express.json());
  app.use(cookieParser());

  // API health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Sobaike Janao (সবাইকে জানাও) API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Backend API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);

  // Global error handler for API routes
  app.use('/api', globalErrorHandler);

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sobaike Janao server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
