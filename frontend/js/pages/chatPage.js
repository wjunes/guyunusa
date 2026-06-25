import { clearApp, $ }            from '../utils/dom.js';
import { store, router }          from '../app.js';
import { EventBus }               from '../modules/eventBus.js';
import { Platform, vibrate }      from '../modules/native.js';
import { t }                      from '../modules/i18n.js';
import { logout }                 from '../services/auth.js';
import { sendMessage,
         loadConversations,
         loadMessages }           from '../services/chat.js';
import { renderSidebar }          from '../components/sidebar.js';
import { renderHeader }           from '../components/header.js';
import { renderInputBar,
         setInputLoading }        from '../components/inputBar.js';
import { renderChatWindow,
         appendMessage,
         showTyping,
         hideTyping }             from '../components/chatWindow.js';
import { openShareModal }         from '../components/shareModal.js';
import { deleteConversation }     from '../services/chat.js';
import { maybeShowLangBanner }    from '../components/langBanner.js';
import { initSidebarResize }      from '../modules/sidebarResize.js';

window.__guyunusa__ = { EventBus };

export async function mount() {
  if (!store.get('user')) { router.navigate('/login'); return; }

  const isMobile = Platform.isCapacitor || window.innerWidth <= 720;

  const app = clearApp();
  app.innerHTML = `
    <div class="o-app" id="o-app">

      <!-- Overlay mobile -->
      <div class="o-sidebar-overlay" id="sidebar-overlay"></div>

      <!-- Historial (izquierda) -->
      <aside class="o-sidebar" id="o-sidebar"></aside>

      <!-- Handle de resize -->
      <div class="o-resize-handle" id="o-resize-handle" title="Arrastrá para cambiar el tamaño"></div>

      <!-- Botón toggle flotante (siempre visible) -->
      <button class="o-sidebar-toggle" id="o-sidebar-toggle"
              aria-label="Mostrar/ocultar historial">
      </button>

      <!-- Chat (derecha, ocupa el resto) -->
      <div class="o-main">
        <div class="o-header"></div>
        <div class="o-chat"></div>
        <div class="o-inputbar"></div>
      </div>

    </div>
  `;

  try { await loadConversations(store); } catch { /* sin red */ }

  renderAll();

  // Inicializar resize + toggle DESPUÉS de renderizar el sidebar
  initSidebarResize();

  registerEvents(isMobile);

  // Banner de idioma (una sola vez, con delay)
  setTimeout(() => maybeShowLangBanner(), 1200);
}

function renderAll() {
  renderSidebar(store);
  renderHeader(store);
  renderChatWindow(store);
  renderInputBar(store);
}

function registerEvents(isMobile) {
  [
    'sidebar:toggle', 'sidebar:close',
    'conv:new', 'conv:select', 'conv:deleted',
    'conv:delete-request', 'conv:share',
    'message:send', 'user:logout',
  ].forEach(ev => EventBus.off(ev));

  // sidebar:toggle ahora usa el módulo de resize (no clase en o-app)
  EventBus.on('sidebar:toggle',       () => {
    if (isMobile) {
      store.get('sidebarOpen') ? closeSidebarMobile() : openSidebarMobile();
    } else {
      // En desktop: delegar al botón flotante
      document.getElementById('o-sidebar-toggle')?.click();
    }
  });

  EventBus.on('sidebar:close',        () => isMobile && closeSidebarMobile());
  EventBus.on('conv:new',             onNewConv);
  EventBus.on('conv:select',          id => onConvSelect(id, isMobile));
  EventBus.on('conv:deleted',         onConvDeleted);
  EventBus.on('conv:delete-request',  id => onDeleteRequest(id));
  EventBus.on('conv:share',           id => openShareModal(id));
  EventBus.on('message:send',         onMessageSend);
  EventBus.on('user:logout',          onLogout);

  $('#sidebar-overlay')?.addEventListener('click', closeSidebarMobile);

  store.subscribe('conversations', () => {
    renderSidebar(store);
    renderHeader(store);
  });
}

/* ── Sidebar mobile ── */
function openSidebarMobile() {
  $('#o-sidebar')?.classList.add('o-sidebar--open');
  $('#sidebar-overlay')?.classList.add('o-sidebar-overlay--visible');
  store.set('sidebarOpen', true);
}
function closeSidebarMobile() {
  $('#o-sidebar')?.classList.remove('o-sidebar--open');
  $('#sidebar-overlay')?.classList.remove('o-sidebar-overlay--visible');
  store.set('sidebarOpen', false);
}

/* ── Conversaciones ── */
function onNewConv() {
  store.update({ activeConvId: null, messages: [] });
  renderHeader(store);
  renderChatWindow(store);
  renderInputBar(store);
  if (window.innerWidth <= 720) closeSidebarMobile();
  setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
}

async function onConvSelect(id, isMobile) {
  if (store.get('activeConvId') === id) {
    if (isMobile) closeSidebarMobile();
    return;
  }
  try {
    await loadMessages(id, store);
    renderSidebar(store);
    renderHeader(store);
    renderChatWindow(store);
    renderInputBar(store);
    if (isMobile) closeSidebarMobile();
    setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
  } catch (err) { showError(err.message); }
}

function onConvDeleted() {
  renderSidebar(store);
  renderHeader(store);
  renderChatWindow(store);
}

async function onDeleteRequest(id) {
  const tr = t();
  const ok = await showConfirm(
    tr.chat.deleteConvTitle, tr.chat.deleteConvBody,
    tr.chat.delete, tr.chat.cancel,
  );
  if (!ok) return;
  try {
    await deleteConversation(id, store);
    renderSidebar(store);
    renderHeader(store);
    if (store.get('activeConvId') === id) {
      store.update({ activeConvId: null, messages: [] });
      renderChatWindow(store);
      renderInputBar(store);
    }
  } catch (err) { showError(err.message); }
}

/* ── Mensajes ── */
async function onMessageSend(text) {
  if (store.get('loading')) return;
  await vibrate('light');

  appendMessage({ role: 'user', content: text, created_at: new Date().toISOString() }, store);
  showTyping();
  setInputLoading(true);

  try {
    const data = await sendMessage(text, store.get('activeConvId'), store);
    hideTyping();

    if (data.conversation_id && !store.get('activeConvId')) {
      store.set('activeConvId', data.conversation_id);
      await loadConversations(store);
      renderSidebar(store);
      renderHeader(store);
    }

    await vibrate('light');
    appendMessage({
      role: 'assistant', content: data.message.content,
      created_at: new Date().toISOString(),
    }, store);

  } catch {
    hideTyping();
    appendMessage({
      role: 'assistant', content: t().chat.errorConn,
      created_at: new Date().toISOString(),
    }, store);
  } finally {
    setInputLoading(false);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
  }
}

function onLogout() { logout(store); router.navigate('/login'); }

/* ── Helpers ── */
function showConfirm(title, body, confirmLabel, cancelLabel) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'c-modal-overlay';
    overlay.innerHTML = `
      <div class="c-modal" role="dialog" aria-modal="true">
        <div class="c-modal__title">${title}</div>
        <div class="c-modal__body">${body}</div>
        <div class="c-modal__actions">
          <button class="btn btn--ghost" id="mc">${cancelLabel}</button>
          <button class="btn btn--primary" id="mk"
                  style="width:auto;background:#c0392b;">${confirmLabel}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const close = val => { overlay.remove(); resolve(val); };
    overlay.querySelector('#mc').addEventListener('click',  () => close(false));
    overlay.querySelector('#mk').addEventListener('click',  () => close(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
  });
}

function showError(msg) {
  const existing = document.getElementById('chat-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'chat-error';
  el.textContent = msg;
  el.style.cssText = `
    position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
    background:#c0392b;color:white;padding:10px 20px;
    border-radius:8px;font-size:14px;z-index:300;
    box-shadow:0 4px 16px rgba(0,0,0,.2);white-space:nowrap;`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
