import bcrypt   from 'bcryptjs';
import { getDB } from '../db/database.js';
import { HTTP_STATUS } from '../../../shared/constants.js';

export function getProfile(req, res) {
  const db   = getDB();
  const user = db.prepare(
    'SELECT id, email, username, plan, created_at FROM users WHERE id = ?'
  ).get(req.user.id);
  res.json({ ok: true, user });
}

export function updateProfile(req, res) {
  const { username, currentPassword, newPassword } = req.body;
  const db   = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ ok: false, message: 'Usuario no encontrado' });
  }

  // — Cambio de nombre de usuario —
  if (username && username.trim().length >= 3) {
    try {
      db.prepare(
        'UPDATE users SET username = ?, updated_at = datetime("now") WHERE id = ?'
      ).run(username.trim(), req.user.id);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          ok: false, message: 'Ese nombre de usuario ya está en uso'
        });
      }
      throw err;
    }
  }

  // — Cambio de contraseña —
  if (newPassword) {
    if (!currentPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        ok: false, message: 'Ingresá tu contraseña actual para cambiarla'
      });
    }
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        ok: false, message: 'La contraseña actual es incorrecta'
      });
    }
    if (newPassword.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        ok: false, message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    const hash = bcrypt.hashSync(newPassword, 10);
    db.prepare(
      'UPDATE users SET password = ?, updated_at = datetime("now") WHERE id = ?'
    ).run(hash, req.user.id);
  }

  // Devolver perfil actualizado
  const updated = db.prepare(
    'SELECT id, email, username, plan, created_at FROM users WHERE id = ?'
  ).get(req.user.id);

  res.json({ ok: true, message: 'Perfil actualizado', user: updated });
}

export function deleteAccount(req, res) {
  const { password } = req.body;
  const db   = getDB();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({ ok: false, message: 'Usuario no encontrado' });
  }
  if (!password || !bcrypt.compareSync(password, user.password)) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      ok: false, message: 'Contraseña incorrecta'
    });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
  res.json({ ok: true, message: 'Cuenta eliminada' });
}
