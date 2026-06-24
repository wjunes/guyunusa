import { $ } from '../utils/dom.js';
import { EventBus } from '../modules/eventBus.js';

export function renderInputBar(store) {
  const el = $('.o-inputbar');
  if (!el) return;

  el.innerHTML = `
    <div class="c-input-bar">
      <div class="c-input-bar__wrap">
        <textarea
          class="c-input-bar__textarea"
          id="chat-input"
          placeholder="Escribí tu mensaje..."
          rows="1"
          autocomplete="off"
        ></textarea>
        <button class="c-input-bar__send" id="btn-send" title="Enviar (Enter)" disabled>
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11z"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="c-input-bar__hint">Enter para enviar · Shift+Enter para nueva línea</div>
  `;

  const textarea = $('#chat-input');
  const sendBtn  = $('#btn-send');

  // Auto-resize del textarea
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
    sendBtn.disabled = !textarea.value.trim();
  });

  // Enviar con Enter (sin Shift)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) doSend();
    }
  });

  sendBtn.addEventListener('click', doSend);

  function doSend() {
    const text = textarea.value.trim();
    if (!text || store.get('loading')) return;
    textarea.value = '';
    textarea.style.height = 'auto';
    sendBtn.disabled = true;
    EventBus.emit('message:send', text);
  }
}

/** Bloquea o desbloquea el input durante la carga */
export function setInputLoading(loading) {
  const textarea = $('#chat-input');
  const sendBtn  = $('#btn-send');
  if (!textarea) return;
  textarea.disabled = loading;
  sendBtn.disabled  = loading;
  textarea.placeholder = loading
    ? 'Guyunusa está escribiendo...'
    : 'Escribí tu mensaje...';
}
