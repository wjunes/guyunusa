      <div class="c-chat__empty-icon">
        <img src="assets/images/guyunusa.png" alt="Guyunusa"
             style="width:80px;height:80px;border-radius:50%;object-fit:cover;opacity:.75;"/>
      </div>import { $ }                    from '../utils/dom.js';
import { scrollToBottom }       from '../utils/helpers.js';
import { initial }              from '../utils/helpers.js';
import { t, getLang }           from '../modules/i18n.js';
import { createMessageItem,
         createTypingIndicator } from './messageItem.js';
import { EventBus }              from '../modules/eventBus.js';
import { createStoryCard }       from './storyCard.js';

export function renderChatWindow(store) {
  const el = $('.o-chat');
  if (!el) return;

  const messages = store.get('messages') || [];
  const user     = store.get('user') || {};
  const userInit = initial(user.username);
  const tr       = t();

  el.innerHTML = `
    <div class="c-chat">
      <div class="c-chat__messages" id="messages-list">
        ${messages.length === 0 ? renderEmpty(tr) : ''}
      </div>
    </div>
  `;

  const list = $('#messages-list');

  if (messages.length > 0) {
    messages.forEach(msg => list.appendChild(createMessageItem(msg, userInit)));
    scrollToBottom(list);
  } else {
    // Insertar la tarjeta de historia PRIMERO, antes de las sugerencias
    const card = createStoryCard(getLang());
    list.insertBefore(card, list.firstChild);
  }

  // Sugerencias — clic envía el mensaje
  el.querySelectorAll('.c-chat__suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      EventBus.emit('message:send', btn.dataset.text);
    });
  });
}

export function appendMessage(msg, store) {
  const list = $('#messages-list');
  if (!list) return;

  // Quitar estado vacío (empty + story card) al llegar el primer mensaje
  const empty = list.querySelector('.c-chat__empty');
  if (empty) empty.remove();
  const card = list.querySelector('.c-story-card');
  if (card) {
    card.style.transition = 'opacity 200ms, transform 200ms';
    card.style.opacity = '0';
    setTimeout(() => card.remove(), 200);
  }

  const user     = store.get('user') || {};
  const userInit = initial(user.username);
  list.appendChild(createMessageItem(msg, userInit));
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

function renderEmpty(tr) {
  const suggestions = tr.chat.suggestions || [];
  return `
    <div class="c-chat__empty">
      <div class="c-chat__empty-title">${tr.chat.emptyTitle}</div>
      <p class="c-chat__empty-sub">${tr.chat.emptySub}</p>
      <div class="c-chat__suggestions">
        ${suggestions.map(s =>
          `<button class="c-chat__suggestion" data-text="${escHTML(s)}">${escHTML(s)}</button>`
        ).join('')}
      </div>
    </div>`;
}

function escHTML(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
