/**
 * sidebarResize.js — Resize draggable del sidebar + toggle flotante
 *
 * - Arrastrá el borde derecho del sidebar para cambiar su ancho
 * - El ancho se persiste en localStorage
 * - El botón toggle siempre es visible y flota sobre el contenido
 * - El toggle solo oculta/muestra el sidebar, nunca el chat
 */

const KEY_WIDTH   = 'guyunusa_sidebar_w';
const KEY_HIDDEN  = 'guyunusa_sidebar_hidden';
const MIN_W       = 160;
const MAX_W       = 420;
const DEFAULT_W   = 260;

let _sidebar = null;
let _handle  = null;
let _toggle  = null;
let _isDragging = false;

/* ── Leer/guardar estado ── */
function getSavedWidth() {
  const v = parseInt(localStorage.getItem(KEY_WIDTH));
  return (!isNaN(v) && v >= MIN_W && v <= MAX_W) ? v : DEFAULT_W;
}
function saveWidth(w)    { localStorage.setItem(KEY_WIDTH,  w); }
function isHidden()      { return localStorage.getItem(KEY_HIDDEN) === '1'; }
function saveHidden(val) { localStorage.setItem(KEY_HIDDEN, val ? '1' : '0'); }

/* ── Aplicar ancho al sidebar y reposicionar el toggle ── */
function applyWidth(w, animate = false) {
  if (!_sidebar) return;
  if (animate) {
    _sidebar.style.transition = 'width 200ms ease';
  } else {
    _sidebar.style.transition = 'none';
  }
  _sidebar.style.width = w + 'px';
  document.documentElement.style.setProperty('--sidebar-w', w + 'px');
  updateTogglePosition(w, _sidebar.classList.contains('o-sidebar--hidden'));
}

/* ── Actualizar posición del botón flotante ── */
function updateTogglePosition(w, hidden) {
  if (!_toggle) return;
  if (hidden) {
    _toggle.classList.add('o-sidebar-toggle--collapsed');
    _toggle.style.left = '8px';
    _toggle.title      = 'Mostrar historial';
    _toggle.innerHTML  = iconOpen();
  } else {
    _toggle.classList.remove('o-sidebar-toggle--collapsed');
    _toggle.style.left = (w + 5 + 6) + 'px';
    _toggle.title      = 'Ocultar historial';
    _toggle.innerHTML  = iconClose();
  }
}

/* ── Drag resize ── */
function initDrag() {
  if (!_handle) return;

  _handle.addEventListener('mousedown', onMouseDown);
  _handle.addEventListener('touchstart', onTouchStart, { passive: true });

  function onMouseDown(e) {
    e.preventDefault();
    startDrag(e.clientX);
  }
  function onTouchStart(e) {
    startDrag(e.touches[0].clientX);
  }

  function startDrag(startX) {
    _isDragging = true;
    _handle.classList.add('o-resize-handle--dragging');
    const startW = parseInt(_sidebar.style.width) || getSavedWidth();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    function onMove(clientX) {
      const delta = clientX - startX;
      const newW  = Math.min(MAX_W, Math.max(MIN_W, startW + delta));
      _sidebar.style.transition = 'none';
      _sidebar.style.width = newW + 'px';
      document.documentElement.style.setProperty('--sidebar-w', newW + 'px');
      updateTogglePosition(newW, false);
    }

    function onMouseMove(e) { onMove(e.clientX); }
    function onTouchMove(e) { onMove(e.touches[0].clientX); }

    function stopDrag() {
      _isDragging = false;
      _handle.classList.remove('o-resize-handle--dragging');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const finalW = parseInt(_sidebar.style.width) || DEFAULT_W;
      saveWidth(finalW);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   stopDrag);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend',  stopDrag);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   stopDrag);
    document.addEventListener('touchmove', onTouchMove, { passive: true });
    document.addEventListener('touchend',  stopDrag);
  }
}

/* ── Toggle ocultar/mostrar ── */
function initToggle() {
  if (!_toggle) return;
  _toggle.addEventListener('click', toggleSidebar);
}

export function toggleSidebar() {
  if (!_sidebar) return;
  const hidden = !_sidebar.classList.contains('o-sidebar--hidden');

  if (hidden) {
    _sidebar.classList.add('o-sidebar--hidden');
    saveHidden(true);
    updateTogglePosition(getSavedWidth(), true);
  } else {
    _sidebar.classList.remove('o-sidebar--hidden');
    saveHidden(false);
    const w = getSavedWidth();
    applyWidth(w, true);
    updateTogglePosition(w, false);
  }
}

/* ── Inicialización pública ── */
export function initSidebarResize() {
  _sidebar = document.getElementById('o-sidebar');
  _handle  = document.getElementById('o-resize-handle');
  _toggle  = document.getElementById('o-sidebar-toggle');

  if (!_sidebar || !_toggle) return;

  const w      = getSavedWidth();
  const hidden = isHidden();

  // Aplicar estado guardado
  if (hidden) {
    _sidebar.classList.add('o-sidebar--hidden');
  }
  applyWidth(w, false);

  initDrag();
  initToggle();
}

/* ── Íconos ── */
function iconClose() {
  // Flecha apuntando a la izquierda (ocultar)
  return `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd"
      d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0"/>
  </svg>`;
}
function iconOpen() {
  // Flecha apuntando a la derecha (mostrar)
  return `<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
    <path fill-rule="evenodd"
      d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708"/>
  </svg>`;
}
