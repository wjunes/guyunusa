/**
 * i18n.js — Internacionalización de Guyunusa
 *
 * Idiomas soportados: es (defecto), en, pt
 * Detección: navigator.language del navegador
 * Persistencia: localStorage
 * Prompt: muestra banner UNA SOLA VEZ si el idioma del sistema difiere del actual
 */

const KEY          = 'guyunusa_lang';
const PROMPTED_KEY = 'guyunusa_lang_prompted';
const SUPPORTED    = ['es', 'en', 'pt'];
const DEFAULT      = 'es';

let _t         = null;   // traducciones activas
let _lang      = DEFAULT;
const _listeners = [];

/* ── Mapeo de códigos BCP-47 → nuestros códigos ── */
function normalizeLang(code) {
  if (!code) return DEFAULT;
  const base = code.toLowerCase().split('-')[0];
  if (base === 'es') return 'es';
  if (base === 'pt') return 'pt';
  if (base === 'en') return 'en';
  return null; // idioma no soportado
}

/* ── Detecta el idioma del navegador ── */
function detectBrowserLang() {
  const langs = navigator.languages || [navigator.language || navigator.userLanguage || ''];
  for (const l of langs) {
    const n = normalizeLang(l);
    if (n) return n;
  }
  return null;
}

/* ── Carga el archivo de traducciones ── */
async function loadTranslations(lang) {
  const mod = await import(`../i18n/${lang}.js`);
  return mod.default;
}

/* ── Notificar cambio a suscriptores ── */
function notify() {
  _listeners.forEach(cb => cb(_lang, _t));
}

/* ── API pública ── */

/** Retorna las traducciones activas */
export function t() { return _t; }

/** Retorna el código del idioma activo */
export function getLang() { return _lang; }

/** Suscribirse a cambios de idioma */
export function onLangChange(cb) { _listeners.push(cb); }

/**
 * Cambia el idioma, lo persiste y notifica.
 * @param {string} lang - 'es' | 'en' | 'pt'
 */
export async function setLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = DEFAULT;
  _t    = await loadTranslations(lang);
  _lang = lang;
  localStorage.setItem(KEY, lang);
  document.documentElement.setAttribute('lang', lang);
  notify();
  return _t;
}

/**
 * Inicializa i18n. Debe llamarse antes de montar cualquier página.
 * Retorna las traducciones activas.
 */
export async function initI18n() {
  const saved   = localStorage.getItem(KEY);
  const initial = SUPPORTED.includes(saved) ? saved : DEFAULT;

  _t    = await loadTranslations(initial);
  _lang = initial;
  document.documentElement.setAttribute('lang', initial);

  return _t;
}

/**
 * Verifica si hay que mostrar el prompt de cambio de idioma.
 * Retorna un objeto con la info necesaria, o null si no hay que mostrar nada.
 *
 * Condiciones para mostrar el prompt:
 *  - Nunca se mostró antes (PROMPTED_KEY no está seteado)
 *  - El idioma del navegador es diferente al actual (es)
 *  - El idioma del navegador es uno de los soportados
 */
export function checkLangPrompt() {
  const alreadyPrompted = localStorage.getItem(PROMPTED_KEY);
  if (alreadyPrompted) return null;

  const current  = getLang();
  const detected = detectBrowserLang();

  if (!detected || detected === current) return null;

  return { detected, current };
}

/** Marca el prompt como ya mostrado */
export function markPrompted() {
  localStorage.setItem(PROMPTED_KEY, '1');
}

/** Nombre legible del idioma */
export function langName(code) {
  return { es: 'Español', en: 'English', pt: 'Português' }[code] ?? code;
}
