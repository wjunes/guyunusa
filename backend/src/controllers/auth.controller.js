import bcrypt from 'bcryptjs';
import jwt    from 'jsonwebtoken';
import { getDB } from '../db/database.js';
import { HTTP_STATUS, ERRORS } from '../../../shared/constants.js';

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

export function register(req, res) {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ ok: false, message: 'Completá todos los campos' });
  }

  const db   = getDB();
  const hash = bcrypt.hashSync(password, 10);

  try {
    const stmt = db.prepare('INSERT INTO users (email, username, password) VALUES (?, ?, ?)');
    const info  = stmt.run(email.toLowerCase(), username, hash);
    const token = signToken({ id: info.lastInsertRowid, username, email });
    res.status(HTTP_STATUS.CREATED).json({ ok: true, token, user: { id: info.lastInsertRowid, username, email } });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ ok: false, message: ERRORS.USER_EXISTS });
    }
    throw err;
  }
}

export function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({ ok: false, message: 'Completá todos los campos' });
  }

  const db   = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ ok: false, message: ERRORS.INVALID_CREDENTIALS });
  }

  const token = signToken({ id: user.id, username: user.username, email: user.email });
  res.json({ ok: true, token, user: { id: user.id, username: user.username, email: user.email, plan: user.plan } });
}

export function logout(_req, res) {
  res.json({ ok: true, message: 'Sesión cerrada' });
}
