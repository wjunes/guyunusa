import jwt from 'jsonwebtoken';
import { HTTP_STATUS, ERRORS } from '../../../shared/constants.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ ok: false, message: ERRORS.TOKEN_EXPIRED });
  }
  try {
    const token   = header.slice(7);
    req.user      = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ ok: false, message: ERRORS.TOKEN_EXPIRED });
  }
}
