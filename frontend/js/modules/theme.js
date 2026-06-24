/**
 * theme.js — Gestión del tema claro/oscuro
 *
 * Prioridad:
 *   1. Preferencia manual en localStorage / Preferences nativo
 *   2. Tema nativo del SO (Electron API si disponible)
 *   3. prefers-color-scheme del navegador
 */

const KEY = 'guyunusa_theme';

const isElectron  = typeof window !== 'undefined' && !!window.electronAPI;
const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor;

function systemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
  // Meta theme-color para navegadores móviles
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.content = getEffectiveTheme(theme) === 'dark' ? '#1a1814' : '#1a4fa0';
  }
  // Status bar de Android
  syncStatusBar(theme);
}

async function syncStatusBar(theme) {
  if (!isCapacitor) return;
  try {
    const { setStatusBar } = await import('./native.js');
    setStatusBar(getEffectiveTheme(theme) === 'dark');
  } catch { /* silencioso */ }
}

function getEffectiveTheme(theme) {
  if (theme !== 'system') return theme;
  return systemPrefersDark() ? 'dark' : 'light';
}

const _listeners = [];
function notifyListeners() {
  const t = getCurrentTheme();
  _listeners.forEach(cb => cb(t));
}

export function onThemeChange(cb) { _listeners.push(cb); }

export function getCurrentTheme() {
  return getEffectiveTheme(localStorage.getItem(KEY) || 'system');
}

export function setTheme(theme) {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
  notifyListeners();
}

export function toggleTheme() {
  const next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export async function initTheme() {
  const saved = localStorage.getItem(KEY) || 'system';

  // Electron: sincronizar con tema nativo del SO
  if (isElectron && saved === 'system') {
    try {
      const { shouldUseDarkColors } = await window.electronAPI.getNativeTheme();
      document.documentElement.setAttribute(
        'data-theme', shouldUseDarkColors ? 'dark' : 'light'
      );
      window.electronAPI.onNativeThemeChanged(({ shouldUseDarkColors }) => {
        if ((localStorage.getItem(KEY) || 'system') === 'system') {
          document.documentElement.setAttribute(
            'data-theme', shouldUseDarkColors ? 'dark' : 'light'
          );
          notifyListeners();
        }
      });
    } catch { applyTheme(saved); }
  } else {
    applyTheme(saved);
  }

  // Escuchar cambios del sistema en browser/Capacitor
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if ((localStorage.getItem(KEY) || 'system') === 'system' && !isElectron) {
      applyTheme('system');
      notifyListeners();
    }
  });

  return getCurrentTheme();
}
