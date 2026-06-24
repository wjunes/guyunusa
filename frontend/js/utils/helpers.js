/** Formatea una fecha ISO a hora HH:MM */
export function formatTime(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' });
}

/** Trunca un string a n caracteres */
export function truncate(str, n = 50) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n).trimEnd() + '…' : str;
}

/** Genera inicial del username para el avatar */
export function initial(name = '') {
  return (name[0] || '?').toUpperCase();
}

/** Debounce simple */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Scroll suave al fondo de un elemento */
export function scrollToBottom(el) {
  if (el) el.scrollTop = el.scrollHeight;
}
