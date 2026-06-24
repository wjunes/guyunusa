/**
 * shareModal.js — Modal para compartir una conversación
 * Soporta: copiar texto, copiar markdown, compartir nativo (Capacitor)
 */
import { api }       from '../services/api.js';
import { shareText } from '../modules/native.js';

export async function openShareModal(conversationId) {
  // Obtener mensajes de la conversación
  let conv, messages;
  try {
    const data = await api.get(`/chat/conversations/${conversationId}`);
    conv     = data.conversation;
    messages = data.messages;
  } catch (err) {
    showToast('No se pudo cargar la conversación', 'error');
    return;
  }

  // Generar texto exportable
  const plainText = buildPlainText(conv, messages);
  const markdown  = buildMarkdown(conv, messages);

  // Montar modal
  const overlay = document.createElement('div');
  overlay.className = 'c-modal-overlay';
  overlay.id = 'share-modal-overlay';

  overlay.innerHTML = `
    <div class="c-share-modal" role="dialog" aria-modal="true"
         aria-label="Compartir conversación">
      <div class="c-share-modal__title">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
        </svg>
        Compartir conversación
      </div>

      <!-- Preview -->
      <div class="c-share-modal__preview" id="share-preview">
        ${escHTML(plainText.slice(0, 600))}${plainText.length > 600 ? '\n…' : ''}
      </div>

      <div class="c-share-modal__copied" id="share-copied">
        ✓ Copiado al portapapeles
      </div>

      <!-- Opciones -->
      <div class="c-share-modal__options">
        <button class="c-share-option" id="share-copy-text">
          <span class="c-share-option__icon">📋</span>
          Copiar texto
        </button>
        <button class="c-share-option" id="share-copy-md">
          <span class="c-share-option__icon">📝</span>
          Copiar Markdown
        </button>
        <button class="c-share-option" id="share-native">
          <span class="c-share-option__icon">📤</span>
          Compartir
        </button>
        <button class="c-share-option" id="share-download">
          <span class="c-share-option__icon">⬇</span>
          Descargar .txt
        </button>
      </div>

      <button class="c-share-modal__close" id="share-close">
        Cerrar
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // — Eventos —
  const close = () => overlay.remove();

  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.getElementById('share-close')?.addEventListener('click', close);

  // Copiar texto plano
  document.getElementById('share-copy-text')?.addEventListener('click', async () => {
    await copyToClipboard(plainText);
    showCopied();
  });

  // Copiar markdown
  document.getElementById('share-copy-md')?.addEventListener('click', async () => {
    await copyToClipboard(markdown);
    showCopied();
  });

  // Compartir nativo (Capacitor Share / Web Share API)
  document.getElementById('share-native')?.addEventListener('click', async () => {
    // Intentar Web Share API primero (browser moderno)
    if (navigator.share) {
      try {
        await navigator.share({
          title: conv.title || 'Conversación de Guyunusa',
          text:  plainText,
        });
        return;
      } catch { /* usuario canceló o no disponible */ }
    }
    // Fallback: Capacitor share
    await shareText(conv.title || 'Conversación de Guyunusa', plainText);
  });

  // Descargar .txt
  document.getElementById('share-download')?.addEventListener('click', () => {
    downloadFile(
      `guyunusa-${slugify(conv.title || 'conversacion')}.txt`,
      plainText
    );
    close();
  });
}

/* ——— Formatos de exportación ——— */

function buildPlainText(conv, messages) {
  const header = [
    `Guyunusa — ${conv.title || 'Conversación'}`,
    `Fecha: ${formatDate(conv.created_at)}`,
    '─'.repeat(40),
    '',
  ].join('\n');

  const body = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const who = m.role === 'user' ? 'Vos' : 'Guyunusa';
      return `${who}:\n${m.content}\n`;
    })
    .join('\n');

  return header + body + '\n\nguyunusa.uy';
}

function buildMarkdown(conv, messages) {
  const header = [
    `# ${conv.title || 'Conversación'}`,
    `> Exportado desde [Guyunusa](https://guyunusa.uy) · ${formatDate(conv.created_at)}`,
    '',
  ].join('\n');

  const body = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      const who = m.role === 'user' ? '**Vos**' : '**Guyunusa**';
      return `${who}\n\n${m.content}`;
    })
    .join('\n\n---\n\n');

  return header + body;
}

/* ——— Helpers ——— */

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Fallback para entornos sin clipboard API
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity  = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function showCopied() {
  const el = document.getElementById('share-copied');
  if (!el) return;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2200);
}

function showToast(msg, type = 'info') {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = `
    position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
    background:${type === 'error' ? '#c0392b' : '#2b2620'};
    color:white; padding:10px 20px; border-radius:8px;
    font-size:13px; z-index:400; white-space:nowrap;
    box-shadow:0 4px 16px rgba(0,0,0,.25);
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-UY', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'conversacion';
}

function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
