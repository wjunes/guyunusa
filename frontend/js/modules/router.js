/**
 * Router SPA mínimo basado en hash
 */
export class Router {
  constructor() {
    this._routes  = new Map();
    this._current = null;
  }

  register(path, loader) {
    this._routes.set(path, loader);
  }

  navigate(path) {
    window.location.hash = path;
  }

  async _resolve() {
    const hash = window.location.hash.slice(1) || '/';
    const loader = this._routes.get(hash);
    if (!loader) {
      console.warn(`[Router] Ruta no encontrada: ${hash}`);
      this.navigate('/');
      return;
    }
    await loader();
    this._current = hash;
  }

  start() {
    window.addEventListener('hashchange', () => this._resolve());
    this._resolve();
  }
}
