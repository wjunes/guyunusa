/**
 * Router SPA basado en hash con soporte de guardia de autenticación
 */
export class Router {
  constructor() {
    this._routes = new Map();
    this._guard  = null;
  }

  register(path, loader) {
    this._routes.set(path, loader);
  }

  setGuard(fn) {
    this._guard = fn;
  }

  navigate(path) {
    window.location.hash = path;
  }

  async _resolve() {
    const hash = window.location.hash.slice(1) || '/';

    // Rutas de resultado de pago — manejar antes del guard
    if (hash.startsWith('/payment/')) {
      const { handlePaymentReturn } = await import('../components/paymentModal.js');
      await handlePaymentReturn();
      return;
    }

    // Aplicar guardia
    if (this._guard) {
      const redirect = this._guard(hash);
      if (redirect) {
        this.navigate(redirect);
        return;
      }
    }

    const loader = this._routes.get(hash);
    if (!loader) {
      this.navigate('/');
      return;
    }

    try {
      await loader();
    } catch (err) {
      console.error('[Router] Error al cargar ruta:', hash, err);
    }
  }

  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  }
}
