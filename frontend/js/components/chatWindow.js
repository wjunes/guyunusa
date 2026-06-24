import { $ }                    from '../utils/dom.js';
import { scrollToBottom }       from '../utils/helpers.js';
import { initial }              from '../utils/helpers.js';
import { createMessageItem,
         createTypingIndicator } from './messageItem.js';

const SUGGESTIONS = [
  '¿Quién fue Artigas y por qué es tan importante?',
  'Contame sobre el Carnaval de Montevideo',
  'Explicame qué es el candombe',
  '¿Cuáles son los mejores libros de Mario Benedetti?',
  'Dame una receta de chivito uruguayo',
];

export function renderChatWindow(store) {
  const el = $('.o-chat');
  if (!el) return;

  const messages = store.get('messages') || [];
  const user     = store.get('user') || {};
  const userInit = initial(user.username);

  el.innerHTML = `
    <div class="c-chat">
      <div class="c-chat__messages" id="messages-list">
        ${messages.length === 0 ? renderEmpty() : ''}
      </div>
    </div>
  `;

  if (messages.length > 0) {
    const list = $('#messages-list');
    messages.forEach(msg => list.appendChild(createMessageItem(msg, userInit)));
    scrollToBottom(list);
  }

  // Sugerencias — clic envía el texto como mensaje
  el.querySelectorAll('.c-chat__suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const { EventBus } = window.__guyunusa__ || {};
      if (EventBus) EventBus.emit('message:send', btn.dataset.text);
    });
  });
}

/** Agrega un mensaje al DOM sin re-renderizar todo */
export function appendMessage(msg, store) {
  const list = $('#messages-list');
  if (!list) return;

  // Quitar estado vacío si existe
  const empty = list.querySelector('.c-chat__empty');
  if (empty) empty.remove();

  const user     = store.get('user') || {};
  const userInit = initial(user.username);
  const item     = createMessageItem(msg, userInit);
  list.appendChild(item);
  scrollToBottom(list);
}

export function showTyping() {
  const list = $('#messages-list');
  if (!list || document.getElementById('typing-indicator')) return;
  list.appendChild(createTypingIndicator());
  scrollToBottom(list);
}

export function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

function renderEmpty() {
  return `
    <div class="c-chat__empty">
      <div class="c-chat__empty-icon">
        <svg width="52" height="52" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg" opacity=".5">
          <circle cx="45" cy="45" r="20" fill="#e8b84b"/>
          <circle cx="45" cy="45" r="17" fill="#f0c96a"/>
          <circle cx="39" cy="43" r="2.2" fill="#b8860b"/>
          <circle cx="51" cy="43" r="2.2" fill="#b8860b"/>
          <path d="M39 51 Q45 56 51 51" stroke="#b8860b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="c-chat__empty-title">¡Hola! Soy Guyunusa</div>
      <p class="c-chat__empty-sub">
        Una IA con alma uruguaya. Preguntame lo que quieras —
        desde historia hasta código, siempre con identidad propia.
      </p>
      <div class="c-chat__suggestions">
        ${SUGGESTIONS.map(s =>
          `<button class="c-chat__suggestion" data-text="${s}">${s}</button>`
        ).join('')}
      </div>
    </div>
  `;
}
