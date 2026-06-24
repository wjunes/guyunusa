import { $ }                          from '../utils/dom.js';
import { EventBus }                   from '../modules/eventBus.js';
import { toggleTheme, getCurrentTheme,
         onThemeChange }              from '../modules/theme.js';

export function renderHeader(store) {
  const el = $('.o-header');
  if (!el) return;

  const convs    = store.get('conversations') || [];
  const activeId = store.get('activeConvId');
  const active   = convs.find(c => c.id === activeId);
  const title    = active ? active.title : 'Guyunusa';
  const isDark   = getCurrentTheme() === 'dark';

  el.innerHTML = `
    <div class="c-header">

      <button class="c-header__toggle" id="btn-toggle-sidebar"
              title="Mostrar/ocultar panel">
        <svg width="17" height="17" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5H5V2H2.5zm3.5 12h7.5a.5.5 0 0 0 .5-.5v-11a.5.5 0 0 0-.5-.5H6v12z"/>
        </svg>
      </button>

      <span class="c-header__title">${escHTML(title)}</span>

      <!-- Toggle tema -->
      <button class="c-header__theme-btn" id="btn-theme"
              title="${isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}"
              aria-label="Cambiar tema">
        ${isDark ? iconSun() : iconMoon()}
      </button>

      <button class="c-header__new-btn" id="btn-header-new">
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5H1.75a.75.75 0 0 1 0-1.5h5.5v-5.5A.75.75 0 0 1 8 1z"/>
        </svg>
        Nuevo
      </button>

    </div>
  `;

  // Sidebar toggle
  $('#btn-toggle-sidebar')?.addEventListener('click', () =>
    EventBus.emit('sidebar:toggle'));

  // Nueva conversación
  $('#btn-header-new')?.addEventListener('click', () =>
    EventBus.emit('conv:new'));

  // Theme toggle
  const themeBtn = $('#btn-theme');
  themeBtn?.addEventListener('click', () => {
    const next = toggleTheme();
    themeBtn.title      = next === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
    themeBtn.innerHTML  = next === 'dark' ? iconSun() : iconMoon();
  });

  // Sincronizar ícono si el tema cambia desde otro lado
  onThemeChange((t) => {
    const btn = $('#btn-theme');
    if (!btn) return;
    btn.innerHTML = t === 'dark' ? iconSun() : iconMoon();
    btn.title     = t === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  });
}

/* —— Íconos SVG —— */
function iconMoon() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M6 .278a.77.77 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277q.792-.001 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278"/>
  </svg>`;
}

function iconSun() {
  return `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13m8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0m-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707M4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708"/>
  </svg>`;
}

function escHTML(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
