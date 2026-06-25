/**
 * app.js — Punto de entrada de Guyunusa
 */
import { Router }        from './modules/router.js';
import { Store }         from './modules/store.js';
import { initTheme }     from './modules/theme.js';
import { initI18n }      from './modules/i18n.js';
import { initAuth }      from './services/auth.js';
import { EventBus }      from './modules/eventBus.js';
import { Platform,
         initKeyboard,
         initAppLifecycle,
         onNetworkChange } from './modules/native.js';

export const store = new Store({
  user:          null,
  token:         null,
  conversations: [],
  activeConvId:  null,
  messages:      [],
  loading:       false,
  sidebarOpen:   true,
  isOnline:      true,
  platform:      Platform.name,
});

export const router = new Router();

async function init() {
  // 1. Tema — primero para evitar flash
  await initTheme();

  // 2. i18n — antes de renderizar cualquier texto
  await initI18n();

  // 3. Funciones nativas
  if (Platform.isCapacitor) {
    await initKeyboard();
    await initAppLifecycle({});
  }

  // 4. Monitor de red
  onNetworkChange((connected) => {
    store.set('isOnline', connected);
    showNetworkBanner(connected);
  });

  // 5. Restaurar sesión
  await initAuth(store);

  // 6. Rutas
  router.register('/login',    () => import('./pages/loginPage.js').then(m => m.mount()));
  router.register('/register', () => import('./pages/registerPage.js').then(m => m.mount()));
  router.register('/',         () => import('./pages/chatPage.js').then(m => m.mount()));
  router.register('/settings', () => import('./pages/settingsPage.js').then(m => m.mount()));

  router.setGuard((path) => {
    const pub = ['/login', '/register'];
    if (!pub.includes(path) && !store.get('user')) return '/login';
    return null;
  });

  // 7. Re-montar la página actual cuando cambia el idioma
  EventBus.on('lang:changed', () => {
    router._resolve();
  });

  router.start();
}

function showNetworkBanner(connected) {
  const existing = document.getElementById('network-banner');
  if (existing) existing.remove();
  if (connected) return;
  const banner = document.createElement('div');
  banner.id = 'network-banner';
  banner.textContent = '⚠ Sin conexión a internet';
  banner.style.cssText = `
    position:fixed; top:0; left:0; right:0;
    background:#c0392b; color:white;
    text-align:center; font-size:13px;
    padding:8px; z-index:9999;
    font-family:system-ui,sans-serif;
  `;
  document.body.prepend(banner);
}

init();
