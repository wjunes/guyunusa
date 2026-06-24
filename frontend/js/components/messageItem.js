import { parseMarkdown } from '../utils/markdown.js';
import { formatTime }    from '../utils/helpers.js';

/**
 * Crea el elemento DOM de un mensaje individual
 * @param {object} msg - { role, content, created_at }
 * @param {string} userInitial - inicial del usuario para el avatar
 */
export function createMessageItem(msg, userInitial = '?') {
  const isUser = msg.role === 'user';
  const wrap   = document.createElement('div');
  wrap.className = `c-message c-message--${msg.role}`;

  const avatarHTML = isUser
    ? `<div class="c-message__avatar">${userInitial}</div>`
    : `<div class="c-message__avatar">${solIconSmall()}</div>`;

  const bubbleContent = isUser
    ? escapeHTML(msg.content).replace(/\n/g, '<br>')
    : parseMarkdown(msg.content);

  wrap.innerHTML = `
    ${avatarHTML}
    <div>
      <div class="c-message__bubble">${bubbleContent}</div>
      <div class="c-message__time">${formatTime(msg.created_at)}</div>
    </div>
  `;
  return wrap;
}

/** Elemento de "Guyunusa está escribiendo..." */
export function createTypingIndicator() {
  const wrap = document.createElement('div');
  wrap.className = 'c-message c-message--assistant c-message--typing';
  wrap.id = 'typing-indicator';
  wrap.innerHTML = `
    <div class="c-message__avatar">${solIconSmall()}</div>
    <div>
      <div class="c-message__bubble">
        <div class="c-typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;
  return wrap;
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function solIconSmall() {
  return `<svg width="22" height="22" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
    <circle cx="45" cy="45" r="20" fill="#e8b84b"/>
    <circle cx="45" cy="45" r="17" fill="#f0c96a"/>
    <circle cx="39" cy="43" r="2.2" fill="#b8860b"/>
    <circle cx="51" cy="43" r="2.2" fill="#b8860b"/>
    <path d="M39 51 Q45 56 51 51" stroke="#b8860b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`;
}
