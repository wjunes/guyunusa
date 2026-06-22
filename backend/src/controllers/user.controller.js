import { getDB } from '../db/database.js';

export function getProfile(req, res) {
  const db   = getDB();
  const user = db.prepare('SELECT id, email, username, plan, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ ok: true, user });
}

export function updateProfile(req, res) {
  const { username } = req.body;
  if (!username?.trim()) return res.status(400).json({ ok: false, message: 'Nombre de usuario requerido' });
  const db = getDB();
  db.prepare('UPDATE users SET username = ?, updated_at = datetime("now") WHERE id = ?').run(username, req.user.id);
  res.json({ ok: true, message: 'Perfil actualizado' });
}
