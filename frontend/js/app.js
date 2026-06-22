/**
 * app.js — Punto de entrada de la aplicación Guyunusa
 * Inicializa el router y monta el primer módulo
 */
import { Router }  from './modules/router.js';
import { Store }   from './modules/store.js';
import { initAuth } from './services/auth.js';

// Instancia global del store
export const store = new Store({
  user:          null,
  token:         null,
  conversations: [],
  activeConvId:  null,
  messages:      [],
  loading:       false,
  sidebarOpen:   true,
});

// Instancia global del router
export const router = new Router();

async function init() {
  // Restaurar sesión si existe
  await initAuth(store);

  // Registrar rutas
  router.register('/',          () => import('./pages/chatPage.js').then(m => m.mount()));
  router.register('/login',     () => import('./pages/loginPage.js').then(m => m.mount()));
  router.register('/register',  () => import('./pages/registerPage.js').then(m => m.mount()));
  router.register('/settings',  () => import('./pages/settingsPage.js').then(m => m.mount()));

  // Arrancar
  router.start();
}

init();
