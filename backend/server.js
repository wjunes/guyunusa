import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { initDB, closeDB, getAdapter } from './src/db/database.js';
import { logger }                      from './src/utils/logger.js';
import { errorMiddleware }             from './src/middleware/error.middleware.js';

import authRoutes from './src/routes/auth.routes.js';
import storyRoutes from './src/routes/story.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app  = express();
const PORT = process.env.PORT || 3000;

async function main() {
  // ── Base de datos ──
  await initDB(process.env.DB_PATH || './data/guyunusa.db');
  logger.info(`Adaptador DB: ${getAdapter()}`);

  // ── CORS ──
  // En desarrollo permite cualquier localhost independientemente del puerto
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl, Electron)
      if (!origin) return callback(null, true);

      // Permitir cualquier localhost/127.0.0.1 en desarrollo
      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      // En producción, solo orígenes explícitamente permitidos
      if (allowedOrigins.includes(origin)) return callback(null, true);

      logger.warn(`CORS bloqueó origin: ${origin}`);
      callback(new Error(`Origin no permitido: ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));

  // ── Garantizar que TODAS las respuestas sean JSON ──
  app.use((_req, res, next) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    next();
  });

  // ── Frontend estático en producción ──
  if (process.env.NODE_ENV === 'production') {
    // En producción servimos el frontend desde Express
    // Debe ir ANTES de las rutas API para que las rutas API tengan prioridad
    const { default: path }   = await import('path');
    const { fileURLToPath }   = await import('url');
    const __dirname            = path.dirname(fileURLToPath(import.meta.url));
    const frontendPath         = path.join(__dirname, '..', 'frontend');
    app.use(express.static(frontendPath));
  }

  // ── Rutas API ──
  app.use('/api/v1/auth',  authRoutes);
  app.use('/api/v1/story', storyRoutes);
  app.use('/api/v1/chat', chatRoutes);
  app.use('/api/v1/user', userRoutes);

  // ── Health check ──
  app.get('/api/v1/health', (_req, res) => {
    res.json({ ok: true, app: 'Guyunusa', version: '1.0.0', db: getAdapter() });
  });

  // ── 404 para rutas API no encontradas ──
  app.use('/api', (_req, res) => {
    res.status(404).json({ ok: false, message: 'Ruta no encontrada' });
  });

  // ── Manejo de errores (siempre devuelve JSON) ──
  app.use(errorMiddleware);

  // ── Arrancar ──
  const server = app.listen(PORT, () => {
    logger.info(`🧉 Guyunusa backend en http://localhost:${PORT}`);
    logger.info(`   Health: http://localhost:${PORT}/api/v1/health`);
  });

  const shutdown = () => { closeDB(); server.close(); process.exit(0); };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

main().catch(err => {
  console.error('Error fatal al iniciar:', err);
  process.exit(1);
});
