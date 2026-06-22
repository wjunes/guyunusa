import { logger } from '../utils/logger.js';

export function errorMiddleware(err, _req, res, _next) {
  logger.error(err.message);
  const status = err.status || 500;
  res.status(status).json({
    ok:      false,
    message: err.message || 'Error interno del servidor',
  });
}
