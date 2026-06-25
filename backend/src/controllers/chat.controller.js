import { getDB }         from '../db/database.js';
import { chat }          from '../services/ai.service.js';
import { SYSTEM_PROMPT } from '../../../shared/systemPrompt.js';
import { HTTP_STATUS, ERRORS, FREE_DAILY_LIMIT } from '../../../shared/constants.js';
import { logger }        from '../utils/logger.js';

// SQL helper — datetime con comillas simples para compatibilidad sql.js
const NOW = `datetime('now')`;

export async function sendMessage(req, res) {
  const { conversation_id, content } = req.body;
  const userId = req.user.id;

  if (!content?.trim()) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      ok: false, message: 'El mensaje no puede estar vacío'
    });
  }

  const db = getDB();

  try {
    // ── Verificar límite diario (plan free) ──
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        ok: false, message: 'Usuario no encontrado'
      });
    }

    if (user.plan === 'free') {
      const today = new Date().toISOString().slice(0, 10);
      const count = db.prepare(
        `SELECT COUNT(*) AS n FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.user_id = ? AND m.role = 'user' AND date(m.created_at) = ?`
      ).get(userId, today);
      if ((count?.n ?? 0) >= FREE_DAILY_LIMIT) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          ok: false, message: ERRORS.RATE_LIMITED
        });
      }
    }

    // ── Obtener o crear conversación ──
    let convId = conversation_id ? Number(conversation_id) : null;
    if (!convId) {
      const title  = content.slice(0, 60);
      const result = db.prepare(
        'INSERT INTO conversations (user_id, title) VALUES (?, ?)'
      ).run(userId, title);
      convId = result.lastInsertRowid;
      logger.info(`Nueva conversación creada: id=${convId}`);
    }

    // ── Guardar mensaje del usuario ──
    db.prepare(
      'INSERT INTO messages (conversation_id, role, content) VALUES (?, ?, ?)'
    ).run(convId, 'user', content);

    // ── Historial para contexto (últimos 20 mensajes) ──
    const history = db.prepare(
      'SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 20'
    ).all(convId).reverse();

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
    ];

    // ── Llamar a la IA ──
    const { content: reply, provider, tokens } = await chat(messages);

    // ── Guardar respuesta ──
    db.prepare(
      'INSERT INTO messages (conversation_id, role, content, provider, tokens_used) VALUES (?, ?, ?, ?, ?)'
    ).run(convId, 'assistant', reply, provider, tokens ?? 0);

    // ── Actualizar título y timestamp ──
    const msgCount = db.prepare(
      'SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?'
    ).get(convId);

    if ((msgCount?.n ?? 0) <= 2) {
      db.prepare(`UPDATE conversations SET title = ?, updated_at = ${NOW} WHERE id = ?`)
        .run(content.slice(0, 60), convId);
    } else {
      db.prepare(`UPDATE conversations SET updated_at = ${NOW} WHERE id = ?`)
        .run(convId);
    }

    return res.json({
      ok: true,
      conversation_id: convId,
      message: { role: 'assistant', content: reply },
      provider,
    });

  } catch (err) {
    logger.error('Error en sendMessage:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({
      ok: false, message: err.message
    });
  }
}

export function getConversations(req, res) {
  try {
    const db    = getDB();
    const convs = db.prepare(
      'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC'
    ).all(req.user.id);
    return res.json({ ok: true, conversations: convs });
  } catch (err) {
    logger.error('Error en getConversations:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ ok: false, message: err.message });
  }
}

export function getMessages(req, res) {
  try {
    const db     = getDB();
    const convId = Number(req.params.id);
    const conv   = db.prepare(
      'SELECT * FROM conversations WHERE id = ? AND user_id = ?'
    ).get(convId, req.user.id);

    if (!conv) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        ok: false, message: 'Conversación no encontrada'
      });
    }

    const messages = db.prepare(
      'SELECT id, role, content, provider, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC'
    ).all(convId);

    return res.json({ ok: true, conversation: conv, messages });
  } catch (err) {
    logger.error('Error en getMessages:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ ok: false, message: err.message });
  }
}

export function deleteConversation(req, res) {
  try {
    const db     = getDB();
    const convId = Number(req.params.id);
    const conv   = db.prepare(
      'SELECT id FROM conversations WHERE id = ? AND user_id = ?'
    ).get(convId, req.user.id);

    if (!conv) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        ok: false, message: 'Conversación no encontrada'
      });
    }

    db.prepare('DELETE FROM conversations WHERE id = ?').run(convId);
    return res.json({ ok: true, message: 'Conversación eliminada' });
  } catch (err) {
    logger.error('Error en deleteConversation:', err.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ ok: false, message: err.message });
  }
}
