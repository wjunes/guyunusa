import bcrypt   from 'bcryptjs';
import jwt      from 'jsonwebtoken';
import { getDB } from '../db/database.js';
import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERRORS } from '../../../shared/constants.js';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

export function register(req, res) {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false, message: 'Completá todos los campos'
    });
  }
  if (password.length < 6) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false, message: 'La contraseña debe tener al menos 6 caracteres'
    });
  }

  const db   = getDB();
  const hash = bcrypt.hashSync(password, 10);

  try {
    const result = db.prepare(
      'INSERT INTO users (email, username, password) VALUES (?, ?, ?)'
    ).run(email.toLowerCase().trim(), username.trim(), hash);

    const id    = result.lastInsertRowid;
    const token = signToken({ id, username: username.trim(), email: email.toLowerCase().trim() });

    logger.info(`Usuario registrado: ${email}`);
    return res.status(HTTP_STATUS.CREATED).json({
      ok: true, token,
      user: { id, username: username.trim(), email: email.toLowerCase().trim(), plan: 'free' }
    });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('unique')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        ok: false, message: ERRORS.USER_EXISTS
      });
    }
    logger.error('Error en register:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({
      ok: false, message: 'Error al crear la cuenta: ' + err.message
    });
  }
}

export function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false, message: 'Completá todos los campos'
    });
  }

  try {
    const db   = getDB();
    const user = db.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).get(email.toLowerCase().trim());

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        ok: false, message: ERRORS.INVALID_CREDENTIALS
      });
    }

    const token = signToken({ id: user.id, username: user.username, email: user.email });
    logger.info(`Login: ${email}`);
    return res.json({
      ok: true, token,
      user: { id: user.id, username: user.username, email: user.email, plan: user.plan }
    });
  } catch (err) {
    logger.error('Error en login:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({
      ok: false, message: 'Error al ingresar: ' + err.message
    });
  }
}

export function logout(_req, res) {
  return res.json({ ok: true, message: 'Sesión cerrada' });
}
