/**
 * Bus de eventos global para comunicación entre módulos
 */
const _listeners = new Map();

export const EventBus = {
  on(event, callback) {
    if (!_listeners.has(event)) _listeners.set(event, []);
    _listeners.get(event).push(callback);
  },

  // Si se pasa callback, elimina ese listener específico.
  // Si no se pasa, elimina TODOS los listeners del evento.
  off(event, callback) {
    if (!callback) {
      _listeners.delete(event);
      return;
    }
    const arr = _listeners.get(event) || [];
    _listeners.set(event, arr.filter(cb => cb !== callback));
  },

  emit(event, data) {
    const arr = _listeners.get(event) || [];
    arr.forEach(cb => cb(data));
  },
};
