import { $, $$ }              from '../utils/dom.js';
import { truncate, initial }  from '../utils/helpers.js';
import { EventBus }           from '../modules/eventBus.js';
import { t }                  from '../modules/i18n.js';
import { deleteConversation } from '../services/chat.js';
import { router }             from '../app.js';

export function renderSidebar(store) {
  const el = $('.o-sidebar');
  if (!el) return;

  const tr     = t();
  const user   = store.get('user') || {};
  const convs  = store.get('conversations') || [];
  const active = store.get('activeConvId');

  el.innerHTML = `
    <div class="c-sidebar">
      <div class="c-sidebar__brand">
        ${solBrandIcon()}
        <span class="c-sidebar__brand-name">Guyunusa</span>
      </div>

      <button class="c-sidebar__new" id="btn-new-conv">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H1.75a.75.75 0 0 1 0-1.5h5.5v-5.5A.75.75 0 0 1 8 1z"/>
        </svg>
        ${tr.chat.newConv}
      </button>

      <div class="c-sidebar__label">${tr.chat.conversations}</div>
      <div class="c-sidebar__list" id="conv-list">
        ${convs.length === 0
          ? `<div class="c-sidebar__empty">${tr.chat.noConvs.replace('\n','<br>')}</div>`
          : convs.map(c => `
            <div class="c-sidebar__item ${c.id === active ? 'c-sidebar__item--active' : ''}"
                 data-conv-id="${c.id}" role="button" tabindex="0"
                 title="${escHTML(c.title)}">
              <span class="c-sidebar__item-icon">💬</span>
              <span class="c-sidebar__item-text">${escHTML(truncate(c.title, 40))}</span>
              <div class="c-sidebar__item-actions">
                <button class="c-sidebar__item-action c-sidebar__item-share"
                        data-share-id="${c.id}"
                        title="${tr.sidebar.share}" aria-label="${tr.sidebar.share}">
                  ${iconShare()}
                </button>
                <button class="c-sidebar__item-action c-sidebar__item-del"
                        data-del-id="${c.id}"
                        title="${tr.sidebar.delete}" aria-label="${tr.sidebar.delete}">
                  ${iconTrash()}
                </button>
              </div>
            </div>`).join('')
        }
      </div>

      <div class="c-sidebar__footer">
        <div class="c-sidebar__footer-actions">
          <button class="c-sidebar__footer-btn" id="btn-settings">
            ${iconSettings()}
            <span>${tr.sidebar.settings}</span>
          </button>
        </div>
        <div class="c-sidebar__user">
          <div class="c-sidebar__avatar">${initial(user.username)}</div>
          <div class="c-sidebar__user-info">
            <div class="c-sidebar__user-name">${escHTML(user.username || '')}</div>
            <div class="c-sidebar__user-plan">
              ${user.plan === 'pro' ? tr.sidebar.proPlan : tr.sidebar.freePlan}
            </div>
          </div>
          <button class="c-sidebar__logout" id="btn-logout"
                  title="${tr.sidebar.logout}" aria-label="${tr.sidebar.logout}">
            ${iconLogout()}
          </button>
        </div>
      </div>
    </div>
  `;

  $('#btn-new-conv')?.addEventListener('click', () => EventBus.emit('conv:new'));

  $$('.c-sidebar__item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.c-sidebar__item-actions')) return;
      EventBus.emit('conv:select', Number(item.dataset.convId));
    });
    item.addEventListener('keydown', e => { if (e.key === 'Enter') item.click(); });
  });

  $$('.c-sidebar__item-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      EventBus.emit('conv:share', Number(btn.dataset.shareId));
    });
  });

  $$('.c-sidebar__item-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      EventBus.emit('conv:delete-request', Number(btn.dataset.delId));
    });
  });

  $('#btn-settings')?.addEventListener('click', () => {
    EventBus.emit('sidebar:close');
    router.navigate('/settings');
  });

  $('#btn-logout')?.addEventListener('click', () => EventBus.emit('user:logout'));
}

/* ── Íconos ── */
function solBrandIcon() {
  return `<svg class="c-sidebar__brand-icon" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg">
    <circle cx="45" cy="45" r="20" fill="#e8b84b"/>
    <circle cx="45" cy="45" r="17" fill="#f0c96a"/>
    <circle cx="39" cy="43" r="2.2" fill="#b8860b"/>
    <circle cx="51" cy="43" r="2.2" fill="#b8860b"/>
    <path d="M39 51 Q45 56 51 51" stroke="#b8860b" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  </svg>`;
}
function iconSettings() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/>
    <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/>
  </svg>`;
}
function iconLogout() {
  return `<svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
    <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
  </svg>`;
}
function iconShare() {
  return `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
  </svg>`;
}
function iconTrash() {
  return `<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>`;
}
function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
