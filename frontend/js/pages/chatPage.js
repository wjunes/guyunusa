import { clearApp, $ }            from '../utils/dom.js';
import { store, router }          from '../app.js';
import { EventBus }               from '../modules/eventBus.js';
import { Platform, vibrate }      from '../modules/native.js';
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

window.__guyunusa__ = { EventBus };

export async function mount() {
  if (!store.get('user')) { router.navigate('/login'); return; }

  const isMobile = Platform.isCapacitor || window.innerWidth <= 640;

  const app = clearApp();
  app.innerHTML = `
    <div class="o-app" id="o-app">
      <div class="o-sidebar-overlay" id="sidebar-overlay"></div>
      <aside class="o-sidebar" id="o-sidebar"></aside>
      <div class="o-main">
        <div class="o-header"></div>
        <div class="o-chat"></div>
        <div class="o-inputbar"></div>
      </div>
    </div>
  `;

  try { await loadConversations(store); } catch { /* sin red */ }

  renderAll();
  registerEvents(isMobile);
}

function renderAll() {
  renderSidebar(store);
  renderHeader(store);
  renderChatWindow(store);
  renderInputBar(store);
}

function registerEvents(isMobile) {
  // Limpiar antes de re-registrar
  [
    'sidebar:toggle', 'sidebar:close',
    'conv:new', 'conv:select', 'conv:deleted',
    'conv:delete-request', 'conv:share',
    'message:send', 'user:logout',
  ].forEach(ev => EventBus.off(ev));

  EventBus.on('sidebar:toggle',        () => onSidebarToggle(isMobile));
  EventBus.on('sidebar:close',         closeSidebar);
  EventBus.on('conv:new',              onNewConv);
  EventBus.on('conv:select',           id => onConvSelect(id, isMobile));
  EventBus.on('conv:deleted',          onConvDeleted);
  EventBus.on('conv:delete-request',   id => onDeleteRequest(id));
  EventBus.on('conv:share',            id => openShareModal(id));
  EventBus.on('message:send',          onMessageSend);
  EventBus.on('user:logout',           onLogout);

  $('#sidebar-overlay')?.addEventListener('click', closeSidebar);

  store.subscribe('conversations', () => {
    renderSidebar(store);
    renderHeader(store);
  });
}

/* ——— Sidebar ——— */
function openSidebar() {
  $('#o-sidebar')?.classList.add('o-sidebar--open');
  $('#sidebar-overlay')?.classList.add('o-sidebar-overlay--visible');
  store.set('sidebarOpen', true);
}
function closeSidebar() {
  $('#o-sidebar')?.classList.remove('o-sidebar--open');
  $('#sidebar-overlay')?.classList.remove('o-sidebar-overlay--visible');
  store.set('sidebarOpen', false);
}
function onSidebarToggle(isMobile) {
  if (isMobile) {
    store.get('sidebarOpen') ? closeSidebar() : openSidebar();
  } else {
    $('#o-app')?.classList.toggle('o-app--sidebar-closed');
  }
}

/* ——— Conversaciones ——— */
function onNewConv() {
  store.update({ activeConvId: null, messages: [] });
  renderHeader(store);
  renderChatWindow(store);
  renderInputBar(store);
  closeSidebar();
  setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
}

async function onConvSelect(id, isMobile) {
  if (store.get('activeConvId') === id) { closeSidebar(); return; }
  try {
    await loadMessages(id, store);
    renderSidebar(store);
    renderHeader(store);
    renderChatWindow(store);
    renderInputBar(store);
    if (isMobile) closeSidebar();
    setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
  } catch (err) {
    showError('No se pudo cargar la conversación: ' + err.message);
  }
}

function onConvDeleted() {
  renderSidebar(store);
  renderHeader(store);
  renderChatWindow(store);
}

async function onDeleteRequest(id) {
  // Modal de confirmación nativo (simple) — sin dependencias extra
  const confirmed = await showDeleteConfirm();
  if (!confirmed) return;
  try {
    await deleteConversation(id, store);
    renderSidebar(store);
    renderHeader(store);
    if (store.get('activeConvId') === id) {
      store.update({ activeConvId: null, messages: [] });
      renderChatWindow(store);
      renderInputBar(store);
    }
  } catch (err) {
    showError('No se pudo eliminar: ' + err.message);
  }
}

function showDeleteConfirm() {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'c-modal-overlay';
    overlay.innerHTML = `
      <div class="c-modal" role="dialog" aria-modal="true">
        <div class="c-modal__title">Eliminar conversación</div>
        <div class="c-modal__body">
          ¿Eliminás esta conversación? No se puede deshacer.
        </div>
        <div class="c-modal__actions">
          <button class="btn btn--ghost" id="del-cancel">Cancelar</button>
          <button class="btn btn--primary" id="del-confirm"
                  style="width:auto;background:#c0392b;">Eliminar</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = val => { overlay.remove(); resolve(val); };
    overlay.querySelector('#del-cancel').addEventListener('click',  () => close(false));
    overlay.querySelector('#del-confirm').addEventListener('click', () => close(true));
    overlay.addEventListener('click', e => { if (e.target === overlay) close(false); });
  });
}

/* ——— Mensajes ——— */
async function onMessageSend(text) {
  if (store.get('loading')) return;
  await vibrate('light');

  appendMessage({
    role: 'user', content: text,
    created_at: new Date().toISOString(),
  }, store);

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
      role: 'assistant',
      content: '⚠ No pude conectarme ahora mismo. Chequeá tu conexión e intentá de nuevo.',
      created_at: new Date().toISOString(),
    }, store);
  } finally {
    setInputLoading(false);
    setTimeout(() => document.getElementById('chat-input')?.focus(), 80);
  }
}

/* ——— Auth ——— */
function onLogout() {
  logout(store);
  router.navigate('/login');
}

/* ——— UI helpers ——— */
function showError(msg) {
  const existing = document.getElementById('chat-error');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'chat-error';
  el.textContent = msg;
  el.style.cssText = `
    position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
    background:#c0392b; color:white; padding:10px 20px;
    border-radius:8px; font-size:14px; z-index:300;
    box-shadow:0 4px 16px rgba(0,0,0,.2); white-space:nowrap;
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
