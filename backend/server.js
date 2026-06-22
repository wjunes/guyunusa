import 'dotenv/config';
import express from 'express';
import cors    from 'cors';
import { initDB, closeDB } from './src/db/database.js';
import { logger }           from './src/utils/logger.js';
import { errorMiddleware }  from './src/middleware/error.middleware.js';

// Rutas
import authRoutes from './src/routes/auth.routes.js';
import chatRoutes from './src/routes/chat.routes.js';
import userRoutes from './src/routes/user.routes.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// Inicializar DB
initDB(process.env.DB_PATH || './data/guyunusa.db');

// Middlewares globales
app.use(cors({
  origin:      (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Servir frontend estático en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend'));
}

// Rutas API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/user', userRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', app: 'Guyunusa', version: '1.0.0' });
});

// Manejo de errores
app.use(errorMiddleware);

// Iniciar servidor
const server = app.listen(PORT, () => {
  logger.info(`Guyunusa backend corriendo en http://localhost:${PORT}`);
});

// Cierre limpio
process.on('SIGTERM', () => { closeDB(); server.close(); });
process.on('SIGINT',  () => { closeDB(); server.close(); process.exit(0); });
