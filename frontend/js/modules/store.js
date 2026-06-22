/**
 * Store reactivo mínimo basado en listeners
 */
export class Store {
  constructor(initialState) {
    this._state     = { ...initialState };
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    this._state[key] = value;
    const cbs = this._listeners.get(key) || [];
    cbs.forEach(cb => cb(value));
  }

  update(partial) {
    Object.entries(partial).forEach(([k, v]) => this.set(k, v));
  }

  subscribe(key, callback) {
    if (!this._listeners.has(key)) this._listeners.set(key, []);
    this._listeners.get(key).push(callback);
    return () => {
      const arr = this._listeners.get(key) || [];
      this._listeners.set(key, arr.filter(cb => cb !== callback));
    };
  }
}
