import { logger } from '../utils/logger.js';

export function errorMiddleware(err, _req, res, _next) {
  logger.error(err.message);

  // Garantizar que siempre responde JSON aunque haya un error de Express
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok:      false,
    message: err.message || 'Error interno del servidor',
  });
}
